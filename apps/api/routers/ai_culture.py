import json
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_session
from models.company import Company
from models.job import Job
from models.user import User
from services.ai_service import (
    continue_culture_interview,
    start_culture_interview,
    suggest_ocean_profile,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ai-culture"])

# ─── Schemas ────────────────────────────────────────────────────────────────


class CultureInterviewStartRequest(BaseModel):
    company_name: str
    industry: Optional[str] = None
    description: Optional[str] = None


class CultureInterviewStartResponse(BaseModel):
    session_id: str
    question: str
    done: bool = False
    culture_vector: Optional[dict] = None
    summary: Optional[str] = None


class CultureInterviewAnswerRequest(BaseModel):
    answer: str


class CultureInterviewAnswerResponse(BaseModel):
    question: str
    done: bool = False
    culture_vector: Optional[dict] = None
    summary: Optional[str] = None


class SuggestOceanRequest(BaseModel):
    job_title: str
    job_description: str


class SuggestOceanResponse(BaseModel):
    ocean_suggested: dict
    justificativa: str


# ─── Translation helper ─────────────────────────────────────────────────────


def translate_culture_vector_to_ai(vector: dict) -> dict:
    """Convert DB culture_vector (o/c/e/a/n keys) to full names for AI."""
    mapping = {
        "o": "openness",
        "c": "conscientiousness",
        "e": "extraversion",
        "a": "agreeableness",
        "n": "neuroticism",
    }
    return {mapping.get(k, k): v for k, v in vector.items()}


# ─── Endpoints ──────────────────────────────────────────────────────────────


@router.post(
    "/companies/{company_id}/ai-culture/start",
    response_model=CultureInterviewStartResponse,
)
async def start_ai_culture_interview(
    company_id: str,
    body: CultureInterviewStartRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Start an AI-driven culture interview for a company."""
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid company_id format",
        )

    result = await session.execute(
        select(Company).where(Company.id == company_uuid)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Company not found"
        )
    if company.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    # Call AI to start interview
    ai_result = await start_culture_interview(
        company_name=body.company_name,
        industry=body.industry,
        description=body.description,
    )

    # Initialize interview history in company record
    interview_data = {
        "history": [
            {"role": "assistant", "content": ai_result.get("question", "")}
        ],
        "company_name": body.company_name,
        "industry": body.industry,
        "description": body.description,
    }
    company.culture_interview = json.dumps(interview_data)
    await session.commit()

    return CultureInterviewStartResponse(
        session_id=company_id,
        question=ai_result.get("question", ""),
        done=ai_result.get("done", False),
        culture_vector=ai_result.get("culture_vector"),
        summary=ai_result.get("summary"),
    )


@router.post(
    "/companies/{company_id}/ai-culture/answer",
    response_model=CultureInterviewAnswerResponse,
)
async def answer_ai_culture_interview(
    company_id: str,
    body: CultureInterviewAnswerRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Send an answer to the AI culture interview."""
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid company_id format",
        )

    result = await session.execute(
        select(Company).where(Company.id == company_uuid)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Company not found"
        )
    if company.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    if not company.culture_interview:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active interview. Start one first.",
        )

    interview_data = json.loads(company.culture_interview)

    # Append user's answer to history
    interview_data["history"].append(
        {"role": "user", "content": body.answer}
    )

    # Call AI to continue interview
    ai_result = await continue_culture_interview(
        history=interview_data["history"],
        company_name=interview_data.get("company_name", ""),
        industry=interview_data.get("industry"),
        description=interview_data.get("description"),
    )

    if ai_result.get("done"):
        # Interview complete — save culture_vector and clear interview state
        vector = ai_result.get("culture_vector", {})
        company.culture_vector = json.dumps(vector)
        company.culture_interview = None  # Clear interview data
        await session.commit()

        return CultureInterviewAnswerResponse(
            question=ai_result.get("summary", "Entrevista concluída!"),
            done=True,
            culture_vector=vector,
            summary=ai_result.get("summary", ""),
        )
    else:
        # Continue interview — save updated history
        interview_data["history"].append(
            {"role": "assistant", "content": ai_result.get("question", "")}
        )
        company.culture_interview = json.dumps(interview_data)
        await session.commit()

        return CultureInterviewAnswerResponse(
            question=ai_result.get("question", ""),
            done=False,
        )


@router.post(
    "/jobs/suggest-ocean",
    response_model=SuggestOceanResponse,
)
async def suggest_ocean_for_job(
    body: SuggestOceanRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Suggest ideal OCEAN profile for a job based on company culture."""
    # Find the company for this user
    result = await session.execute(
        select(Company).where(Company.user_id == current_user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found for this user",
        )

    # Fallback if no culture_vector
    culture_vector = {"o": 0.5, "c": 0.5, "e": 0.5, "a": 0.5, "n": 0.5}
    culture_summary = "Cultura não definida"

    if company.culture_vector:
        try:
            culture_vector = json.loads(company.culture_vector)
            if isinstance(culture_vector, str):
                culture_vector = json.loads(culture_vector)
        except (json.JSONDecodeError, TypeError):
            pass

    # Try to get culture summary from interview notes or company description
    if company.description:
        culture_summary = f"{company.name}: {company.description}"
    elif company.culture_interview:
        try:
            interview_data = json.loads(company.culture_interview)
            culture_summary = interview_data.get("company_name", company.name)
        except (json.JSONDecodeError, TypeError):
            culture_summary = company.name
    else:
        culture_summary = company.name

    # Call AI to suggest profile
    ai_result = await suggest_ocean_profile(
        culture_vector=culture_vector,
        culture_summary=culture_summary,
        job_title=body.job_title,
        job_description=body.job_description,
    )

    if "error" in ai_result:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=ai_result["error"],
        )

    return SuggestOceanResponse(
        ocean_suggested={
            "o": ai_result.get("o", culture_vector.get("o", 0.5)),
            "c": ai_result.get("c", culture_vector.get("c", 0.5)),
            "e": ai_result.get("e", culture_vector.get("e", 0.5)),
            "a": ai_result.get("a", culture_vector.get("a", 0.5)),
            "n": ai_result.get("n", culture_vector.get("n", 0.5)),
        },
        justificativa=ai_result.get("justificativa", ""),
    )
