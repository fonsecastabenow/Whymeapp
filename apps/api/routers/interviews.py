import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models.candidate import Candidate
from models.interview import Interview

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interviews", tags=["interviews"])

# Valid state transitions
VALID_TRANSITIONS = {
    "invited": ["started"],
    "started": ["ocean_pending"],
    "ocean_pending": ["ocean_completed"],
    "ocean_completed": ["completed"],
    "completed": ["matched"],
}


# --- Request/Response Models ---


class CreateInterviewRequest(BaseModel):
    candidate_id: str | None = None
    temp_session_token: str | None = None


class CreateInterviewResponse(BaseModel):
    id: str
    candidate_id: str | None
    temp_session_token: str | None
    status: str
    current_step: str | None
    ocean_scores: dict | None
    accommodations: dict | None = None
    created_at: str
    updated_at: str


class InterviewStatusResponse(BaseModel):
    id: str
    candidate_id: str | None
    temp_session_token: str | None
    status: str
    current_step: str | None
    ocean_scores: dict | None
    accommodations: dict | None = None
    created_at: str
    updated_at: str


class UpdateStatusRequest(BaseModel):
    status: str


class UpdateStatusResponse(BaseModel):
    id: str
    status: str
    message: str


class SaveScoresRequest(BaseModel):
    ocean_scores: dict


class SaveScoresResponse(BaseModel):
    id: str
    status: str
    message: str


# --- Helper ---


async def _interview_to_response(interview: Interview, session: AsyncSession | None = None) -> dict:
    accommodations = None
    if interview.candidate_id and session:
        result = await session.execute(
            select(Candidate.accommodations).where(Candidate.id == interview.candidate_id)
        )
        accommodations = result.scalar_one_or_none()

    return {
        "id": str(interview.id),
        "candidate_id": str(interview.candidate_id) if interview.candidate_id else None,
        "temp_session_token": interview.temp_session_token,
        "status": interview.status,
        "current_step": interview.current_step,
        "ocean_scores": interview.ocean_scores,
        "accommodations": accommodations,
        "created_at": interview.created_at.isoformat(),
        "updated_at": interview.updated_at.isoformat(),
    }


# --- Endpoints ---


@router.post("", response_model=CreateInterviewResponse, status_code=201)
async def create_interview(
    request: CreateInterviewRequest,
    session: AsyncSession = Depends(get_session),
):
    if not request.candidate_id and not request.temp_session_token:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either candidate_id or temp_session_token is required",
        )

    try:
        candidate_uuid = uuid.UUID(request.candidate_id) if request.candidate_id else None
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid candidate_id format",
        )

    interview = Interview(
        candidate_id=candidate_uuid,
        temp_session_token=request.temp_session_token,
        status="invited",
    )
    session.add(interview)
    await session.flush()
    await session.refresh(interview)

    return await _interview_to_response(interview, session)


@router.get("/{interview_id}", response_model=InterviewStatusResponse)
async def get_interview(
    interview_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Interview).where(Interview.id == interview_id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )
    return await _interview_to_response(interview, session)


@router.patch("/{interview_id}/status", response_model=UpdateStatusResponse)
async def update_interview_status(
    interview_id: str,
    request: UpdateStatusRequest,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Interview).where(Interview.id == interview_id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    allowed_next_states = VALID_TRANSITIONS.get(interview.status, [])
    if request.status not in allowed_next_states:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Invalid transition from '{interview.status}' to '{request.status}'. "
                f"Allowed transitions: {allowed_next_states or ['none']}"
            ),
        )

    interview.status = request.status
    await session.flush()
    await session.refresh(interview)

    if interview.status == "completed":
        try:
            from tasks.matching import trigger_matching
            trigger_matching.delay(str(interview.id))
            logger.info("Enqueued trigger_matching for interview %s", interview.id)
        except Exception as exc:
            logger.warning("Failed to enqueue trigger_matching for interview %s: %s", interview.id, exc)

    return UpdateStatusResponse(
        id=str(interview.id),
        status=interview.status,
        message=f"Status transitioned to '{interview.status}'",
    )


@router.patch("/{interview_id}/scores", response_model=SaveScoresResponse)
async def save_interview_scores(
    interview_id: str,
    request: SaveScoresRequest,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Interview).where(Interview.id == interview_id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    if interview.status != "ocean_completed":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Scores can only be saved when status is 'ocean_completed'. "
                f"Current status: '{interview.status}'"
            ),
        )

    interview.ocean_scores = request.ocean_scores
    await session.flush()
    await session.refresh(interview)

    return SaveScoresResponse(
        id=str(interview.id),
        status=interview.status,
        message="OCEAN scores saved successfully",
    )
