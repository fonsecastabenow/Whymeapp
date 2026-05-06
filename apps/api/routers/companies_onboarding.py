import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_session
from models.company import Company
from models.culture_question import CultureQuestion
from models.education_level import ReferenceEducationLevel
from models.hard_skill import ReferenceHardSkill
from models.user import User

router = APIRouter(prefix="/companies", tags=["companies"])

OCEAN_KEYS = {
    "openness": "o",
    "conscientiousness": "c",
    "extraversion": "e",
    "agreeableness": "a",
    "neuroticism": "n",
}

WORK_MODELS = ["presencial", "hibrido", "remoto"]
LANGUAGE_LEVELS = ["Iniciante", "Basico", "Intermediario", "Avançado", "Fluente"]


class CultureQuestionOut(BaseModel):
    id: str
    question_pt: str
    dimension: str
    direction: int
    sort_order: Optional[int]


class CultureAnswer(BaseModel):
    question_id: str
    score: int = Field(..., ge=1, le=5)


class CultureQuestionnaireRequest(BaseModel):
    answers: list[CultureAnswer]


class CultureVectorResponse(BaseModel):
    culture_vector: dict
    dimensions: dict


class ReferenceDataResponse(BaseModel):
    hard_skills: list[dict]
    education_levels: list[str]
    work_models: list[str]
    language_levels: list[str]


@router.get("/culture-questions", response_model=list[CultureQuestionOut])
async def get_culture_questions(
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(CultureQuestion).order_by(CultureQuestion.sort_order)
    )
    questions = result.scalars().all()
    return [
        CultureQuestionOut(
            id=str(q.id),
            question_pt=q.question_pt,
            dimension=q.dimension,
            direction=q.direction,
            sort_order=q.sort_order,
        )
        for q in questions
    ]


@router.post("/{company_id}/culture-questionnaire", response_model=CultureVectorResponse)
async def submit_culture_questionnaire(
    company_id: str,
    body: CultureQuestionnaireRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid company_id format",
        )

    result = await session.execute(select(Company).where(Company.id == company_uuid))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    if company.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if not body.answers:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No answers provided")

    question_ids = [uuid.UUID(a.question_id) for a in body.answers]
    q_result = await session.execute(
        select(CultureQuestion).where(CultureQuestion.id.in_(question_ids))
    )
    questions = {str(q.id): q for q in q_result.scalars().all()}

    dim_scores: dict[str, list[float]] = {dim: [] for dim in OCEAN_KEYS}

    for answer in body.answers:
        q = questions.get(answer.question_id)
        if not q:
            continue
        # Invert score when direction is -1 so high score always means high trait
        effective = answer.score if q.direction == 1 else (6 - answer.score)
        dim_scores[q.dimension].append(float(effective))

    vector: dict[str, float] = {}
    dimensions: dict[str, float] = {}

    for dim, key in OCEAN_KEYS.items():
        scores = dim_scores.get(dim, [])
        if scores:
            mean_val = sum(scores) / len(scores)
            normalized = round((mean_val - 1) / 4, 3)  # scale 1-5 → 0-1
        else:
            normalized = 0.5
        vector[key] = normalized
        dimensions[dim] = normalized

    company.culture_vector = json.dumps(vector)
    await session.commit()
    await session.refresh(company)

    return CultureVectorResponse(culture_vector=vector, dimensions=dimensions)


@router.get("/reference-data", response_model=ReferenceDataResponse)
async def get_reference_data(
    session: AsyncSession = Depends(get_session),
):
    hard_skills: list[dict] = []
    education_levels: list[str] = []

    try:
        hs_result = await session.execute(
            select(ReferenceHardSkill).order_by(ReferenceHardSkill.category, ReferenceHardSkill.name)
        )
        hard_skills = [
            {"id": str(hs.id), "name": hs.name, "category": hs.category}
            for hs in hs_result.scalars().all()
        ]
    except Exception:
        pass

    try:
        ed_result = await session.execute(select(ReferenceEducationLevel))
        education_levels = [el.name for el in ed_result.scalars().all()]
    except Exception:
        pass

    return ReferenceDataResponse(
        hard_skills=hard_skills,
        education_levels=education_levels,
        work_models=WORK_MODELS,
        language_levels=LANGUAGE_LEVELS,
    )
