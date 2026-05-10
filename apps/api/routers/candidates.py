import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user, hash_password
from database import get_session
from models.candidate import Candidate
from models.education_level import ReferenceEducationLevel
from models.hard_skill import ReferenceHardSkill
from models.interview import Interview
from models.temp_session import TempSession
from models.user import User

router = APIRouter(prefix="/candidates", tags=["candidates"])

# ─── Reference Data ──────────────────────────────────────────────────────

PROFESSIONAL_LEVELS = ["junior", "pleno", "senior", "tech-lead", "specialist"]
WORK_MODELS = ["presencial", "hibrido", "remoto", "indiferente"]
LANGUAGE_LEVELS = ["Iniciante", "Básico", "Intermediário", "Avançado", "Fluente/Nativo"]


@router.get("/reference-data")
async def get_reference_data(
    session: AsyncSession = Depends(get_session),
):
    hard_skills_result = await session.execute(
        select(ReferenceHardSkill).order_by(ReferenceHardSkill.category, ReferenceHardSkill.name)
    )
    hard_skills = [
        {"id": str(s.id), "name": s.name, "category": s.category}
        for s in hard_skills_result.scalars().all()
    ]

    edu_result = await session.execute(
        select(ReferenceEducationLevel).order_by(ReferenceEducationLevel.name)
    )
    education_levels = [
        {"id": str(e.id), "name": e.name}
        for e in edu_result.scalars().all()
    ]

    return {
        "hard_skills": hard_skills,
        "education_levels": education_levels,
        "professional_levels": PROFESSIONAL_LEVELS,
        "work_models": WORK_MODELS,
        "language_levels": LANGUAGE_LEVELS,
    }


# ─── Anonymous Candidate ─────────────────────────────────────────────────


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

    candidate_result = await session.execute(
        select(Candidate).where(Candidate.id == cand_uuid)
    )
    candidate = candidate_result.scalar_one_or_none()

    return {
        "id": str(interview.id),
        "candidate_id": str(interview.candidate_id) if interview.candidate_id else None,
        "status": interview.status,
        "current_step": interview.current_step,
        "ocean_scores": interview.ocean_scores,
        "accommodations": candidate.accommodations if candidate else None,
        "created_at": interview.created_at.isoformat(),
        "updated_at": interview.updated_at.isoformat(),
    }


# ─── Profile ─────────────────────────────────────────────────────────────


class EducationData(BaseModel):
    level: str | None = None
    course: str | None = None
    institution: str | None = None
    additional_courses: list[dict] | None = None


class LanguageData(BaseModel):
    language: str
    level: str


class SalaryExpectation(BaseModel):
    min: float | None = None
    max: float | None = None
    currency: str = "BRL"


class CandidateProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    headline: str | None
    location: str | None
    experience_years: float | None
    skills: dict | None
    ocean_scores: dict | None
    phone: str | None = None
    education: EducationData | None = None
    languages: list[LanguageData] | None = None
    hard_skills: list[str] | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    salary_expectation: SalaryExpectation | None = None
    work_model: str | None = None
    linkedin_url: str | None = None
    portfolio_url: str | None = None
    professional_level: str | None = None
    onboarding_completed: bool = False
    created_at: str


class CandidateUpdateRequest(BaseModel):
    name: str | None = None
    headline: str | None = None
    location: str | None = None
    experience_years: float | None = None
    skills: dict | None = None
    phone: str | None = None
    education: EducationData | None = None
    languages: list[LanguageData] | None = None
    hard_skills: list[str] | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    salary_expectation: SalaryExpectation | None = None
    work_model: str | None = None
    linkedin_url: str | None = None
    portfolio_url: str | None = None
    professional_level: str | None = None


class CandidateOnboardingRequest(BaseModel):
    phone: str | None = None
    education: EducationData
    languages: list[LanguageData] = []
    hard_skills: list[str] = []
    city: str
    state: str
    country: str
    salary_expectation: SalaryExpectation | None = None
    work_model: str
    linkedin_url: str | None = None
    portfolio_url: str | None = None
    professional_level: str


def _candidate_to_response(candidate: Candidate) -> CandidateProfileResponse:
    edu = None
    if candidate.education:
        edu = EducationData(
            level=candidate.education.get("level"),
            course=candidate.education.get("course"),
            institution=candidate.education.get("institution"),
        )
    langs = None
    if candidate.languages:
        langs = [LanguageData(**l) if isinstance(l, dict) else LanguageData(language=l["language"], level=l["level"]) for l in candidate.languages]
    sal = None
    if candidate.salary_expectation:
        sal = SalaryExpectation(
            min=candidate.salary_expectation.get("min"),
            max=candidate.salary_expectation.get("max"),
            currency=candidate.salary_expectation.get("currency", "BRL"),
        )
    hard_skills = None
    if candidate.hard_skills:
        hard_skills = list(candidate.hard_skills)

    return CandidateProfileResponse(
        id=str(candidate.id),
        user_id=str(candidate.user_id),
        name=candidate.name,
        headline=candidate.headline,
        location=candidate.location,
        experience_years=candidate.experience_years,
        skills=candidate.skills,
        ocean_scores=candidate.ocean_scores,
        phone=candidate.phone,
        education=edu,
        languages=langs,
        hard_skills=hard_skills,
        city=candidate.city,
        state=candidate.state,
        country=candidate.country,
        salary_expectation=sal,
        work_model=candidate.work_model,
        linkedin_url=candidate.linkedin_url,
        portfolio_url=candidate.portfolio_url,
        professional_level=candidate.professional_level,
        onboarding_completed=candidate.onboarding_completed,
        created_at=candidate.created_at.isoformat(),
    )


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

    return _candidate_to_response(candidate)


@router.patch("/{candidate_id}", response_model=CandidateProfileResponse)
async def update_candidate_profile(
    candidate_id: str,
    request: CandidateUpdateRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    if candidate.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            if field == "education" and isinstance(value, EducationData):
                value = value.model_dump(exclude_none=True)
            elif field == "salary_expectation" and isinstance(value, SalaryExpectation):
                value = value.model_dump(exclude_none=True)
            elif field == "languages" and isinstance(value, list):
                value = [l.model_dump() if isinstance(l, LanguageData) else l for l in value]
            setattr(candidate, field, value)
        else:
            setattr(candidate, field, value)

    await session.flush()
    await session.refresh(candidate)

    return _candidate_to_response(candidate)


@router.post("/{candidate_id}/onboarding", response_model=CandidateProfileResponse)
async def submit_onboarding(
    candidate_id: str,
    request: CandidateOnboardingRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    if candidate.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Save all onboarding fields
    candidate.phone = request.phone
    candidate.education = request.education.model_dump(exclude_none=True) if request.education else None
    candidate.languages = [l.model_dump() for l in request.languages]
    candidate.hard_skills = request.hard_skills
    candidate.city = request.city
    candidate.state = request.state
    candidate.country = request.country
    candidate.salary_expectation = request.salary_expectation.model_dump(exclude_none=True) if request.salary_expectation else None
    candidate.work_model = request.work_model
    candidate.linkedin_url = request.linkedin_url
    candidate.portfolio_url = request.portfolio_url
    candidate.professional_level = request.professional_level
    candidate.onboarding_completed = True

    await session.flush()
    await session.refresh(candidate)

    return _candidate_to_response(candidate)


# ─── Convert ─────────────────────────────────────────────────────────────


@router.post("/convert", response_model=ConvertCandidateResponse)
async def convert_candidate(
    request: ConvertCandidateRequest,
    session: AsyncSession = Depends(get_session),
):
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

    result = await session.execute(select(Candidate).where(Candidate.id == cand_uuid))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    result = await session.execute(select(User).where(User.id == candidate.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

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


# ─── By Email (Public) ───────────────────────────────────────────────────


@router.get("/by-email/{email}")
async def get_candidate_by_email(
    email: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with this email",
        )

    result = await session.execute(
        select(Candidate).where(Candidate.user_id == user.id)
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found for this user",
        )

    return {"id": str(candidate.id), "name": candidate.name}
