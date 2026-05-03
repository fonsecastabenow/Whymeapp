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


# ─── Questionnaire Models & Logic ─────────────────────────────────────────


class SubmitQuestionnaireRequest(BaseModel):
    respostas: list[int]


class SubmitQuestionnaireResponse(BaseModel):
    id: str
    status: str
    ocean_scores: dict[str, float]
    message: str


REVERSED_ITEMS: set[int] = {3, 6, 9, 12, 14, 16, 18, 20, 22, 25, 27, 30}

DIMENSION_MAP: dict[int, str] = {}
for i in range(1, 7):
    DIMENSION_MAP[i] = "openness"
for i in range(7, 13):
    DIMENSION_MAP[i] = "conscientiousness"
for i in range(13, 19):
    DIMENSION_MAP[i] = "extraversion"
for i in range(19, 25):
    DIMENSION_MAP[i] = "agreeableness"
for i in range(25, 31):
    DIMENSION_MAP[i] = "neuroticism"


def compute_ocean_score(respostas: list[int]) -> dict[str, float]:
    """Calculate OCEAN scores from 30 Likert [1-5] responses."""
    if len(respostas) != 30:
        raise ValueError(f"Expected 30 responses, got {len(respostas)}")

    processed: list[int] = []
    for idx, raw in enumerate(respostas, start=1):
        if raw < 1 or raw > 5:
            raise ValueError(f"Response at question {idx} is {raw}, expected 1-5")
        if idx in REVERSED_ITEMS:
            processed.append(6 - raw)
        else:
            processed.append(raw)

    scores: dict[str, float] = {}
    dims = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]
    for dim in dims:
        dim_indices = [i for i in range(30) if DIMENSION_MAP[i + 1] == dim]
        raw_mean = sum(processed[i] for i in dim_indices) / len(dim_indices)
        scaled = ((raw_mean - 1.0) / 4.0) * 100.0
        scores[dim] = round(max(0.0, min(100.0, scaled)), 2)

    return scores


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


@router.post("/{interview_id}/questionnaire", response_model=SubmitQuestionnaireResponse)
async def submit_questionnaire(
    interview_id: str,
    request: SubmitQuestionnaireRequest,
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

    if interview.status not in ("started", "ocean_pending"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Questionnaire can only be submitted when status is 'started' "
                f"or 'ocean_pending'. Current status: '{interview.status}'"
            ),
        )

    if len(request.respostas) != 30:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Expected exactly 30 responses, got {len(request.respostas)}",
        )

    for idx, val in enumerate(request.respostas, start=1):
        if val < 1 or val > 5:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Response at question {idx} is {val}, expected 1-5",
            )

    try:
        ocean_scores = compute_ocean_score(request.respostas)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    interview.ocean_scores = ocean_scores
    interview.status = "ocean_completed"
    await session.flush()
    await session.refresh(interview)

    return SubmitQuestionnaireResponse(
        id=str(interview.id),
        status=interview.status,
        ocean_scores=ocean_scores,
        message="Questionnaire submitted successfully",
    )
