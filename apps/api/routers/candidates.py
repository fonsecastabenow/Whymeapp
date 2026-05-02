import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import hash_password
from database import get_session
from models.candidate import Candidate
from models.interview import Interview
from models.temp_session import TempSession
from models.user import User

router = APIRouter(prefix="/candidates", tags=["candidates"])


class AnonymousCandidateResponse(BaseModel):
    candidate_id: str
    interview_link: str
    token: str


class ValidateTokenResponse(BaseModel):
    candidate_id: str
    valid: bool


class ConvertCandidateRequest(BaseModel):
    candidate_id: str
    token: str
    email: EmailStr
    password: str
    name: str


class ConvertCandidateResponse(BaseModel):
    user_id: str
    candidate_id: str
    email: str
    name: str


@router.post("/anonymous", response_model=AnonymousCandidateResponse, status_code=201)
async def create_anonymous_candidate(
    session: AsyncSession = Depends(get_session),
):
    anon_uuid = uuid.uuid4()
    anon_email = f"anon_{anon_uuid}@temp.whyme.app"
    anon_password = uuid.uuid4().hex + uuid.uuid4().hex

    user = User(
        email=anon_email,
        password_hash=hash_password(anon_password),
        name="Anonymous",
        role="candidate",
    )
    session.add(user)
    await session.flush()
    await session.refresh(user)

    candidate = Candidate(
        user_id=user.id,
        name="Anonymous",
    )
    session.add(candidate)
    await session.flush()
    await session.refresh(candidate)

    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    temp_session = TempSession(
        candidate_id=candidate.id,
        token=session_token,
        expires_at=expires_at,
    )
    session.add(temp_session)
    await session.flush()
    await session.refresh(temp_session)

    return AnonymousCandidateResponse(
        candidate_id=str(candidate.id),
        interview_link=f"/interview/{candidate.id}",
        token=session_token,
    )


@router.get("/validate-token", response_model=ValidateTokenResponse)
async def validate_token(
    token: str = Query(...),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(TempSession).where(TempSession.token == token)
    )
    temp_session = result.scalar_one_or_none()
    if not temp_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found",
        )
    if temp_session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    return ValidateTokenResponse(candidate_id=str(temp_session.candidate_id), valid=True)


@router.get("/{candidate_id}/interview")
async def get_candidate_interview(
    candidate_id: str,
    session: AsyncSession = Depends(get_session),
):
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid candidate_id format",
        )

    result = await session.execute(
        select(Interview)
        .where(Interview.candidate_id == cand_uuid)
        .order_by(Interview.created_at.desc())
        .limit(1)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No interview found for candidate",
        )

    return {
        "id": str(interview.id),
        "candidate_id": str(interview.candidate_id) if interview.candidate_id else None,
        "status": interview.status,
        "current_step": interview.current_step,
        "ocean_scores": interview.ocean_scores,
        "created_at": interview.created_at.isoformat(),
        "updated_at": interview.updated_at.isoformat(),
    }


class CandidateProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    headline: str | None
    location: str | None
    experience_years: float | None
    skills: dict | None
    ocean_scores: dict | None
    created_at: str


@router.get("/{candidate_id}", response_model=CandidateProfileResponse)
async def get_candidate_profile(
    candidate_id: str,
    session: AsyncSession = Depends(get_session),
):
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid candidate_id format",
        )

    result = await session.execute(select(Candidate).where(Candidate.id == cand_uuid))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    return CandidateProfileResponse(
        id=str(candidate.id),
        user_id=str(candidate.user_id),
        name=candidate.name,
        headline=candidate.headline,
        location=candidate.location,
        experience_years=candidate.experience_years,
        skills=candidate.skills,
        ocean_scores=candidate.ocean_scores,
        created_at=candidate.created_at.isoformat(),
    )


@router.post("/convert", response_model=ConvertCandidateResponse)
async def convert_candidate(
    request: ConvertCandidateRequest,
    session: AsyncSession = Depends(get_session),
):
    # Validate token
    result = await session.execute(
        select(TempSession).where(TempSession.token == request.token)
    )
    temp_session = result.scalar_one_or_none()
    if not temp_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found")
    if temp_session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    try:
        cand_uuid = uuid.UUID(request.candidate_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid candidate_id format",
        )

    if temp_session.candidate_id != cand_uuid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token does not match candidate",
        )

    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 6 characters",
        )

    # Fetch candidate and its user
    result = await session.execute(select(Candidate).where(Candidate.id == cand_uuid))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    result = await session.execute(select(User).where(User.id == candidate.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check email uniqueness (allow if it's the same user being converted)
    result = await session.execute(select(User).where(User.email == request.email))
    existing = result.scalar_one_or_none()
    if existing and existing.id != user.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user.email = request.email
    user.password_hash = hash_password(request.password)
    user.name = request.name
    candidate.name = request.name

    await session.flush()
    await session.refresh(user)
    await session.refresh(candidate)

    return ConvertCandidateResponse(
        user_id=str(user.id),
        candidate_id=str(candidate.id),
        email=user.email,
        name=user.name,
    )
