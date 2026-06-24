from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_session
from models.candidate import Candidate
from models.company import Company
from models.interview import Interview
from models.job import Job
from models.match import Match
from models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores",
        )
    return current_user


class RecentCompany(BaseModel):
    id: str
    name: str
    industry: str | None
    created_at: str


class RecentCandidate(BaseModel):
    id: str
    name: str
    onboarding_completed: bool
    created_at: str


class AdminStatsResponse(BaseModel):
    total_companies: int
    total_candidates: int
    total_jobs: int
    active_jobs: int
    total_matches: int
    pending_matches: int
    total_interviews: int
    completed_interviews: int
    candidates_with_ocean: int
    recent_companies: list[RecentCompany]
    recent_candidates: list[RecentCandidate]


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    session: AsyncSession = Depends(get_session),
    _admin: User = Depends(require_admin),
):
    total_companies = (await session.execute(
        select(func.count()).select_from(Company)
    )).scalar_one()

    total_candidates = (await session.execute(
        select(func.count()).select_from(Candidate)
    )).scalar_one()

    total_jobs = (await session.execute(
        select(func.count()).select_from(Job)
    )).scalar_one()

    active_jobs = (await session.execute(
        select(func.count()).select_from(Job).where(Job.status == "active")
    )).scalar_one()

    total_matches = (await session.execute(
        select(func.count()).select_from(Match)
    )).scalar_one()

    pending_matches = (await session.execute(
        select(func.count()).select_from(Match).where(Match.status == "pending")
    )).scalar_one()

    total_interviews = (await session.execute(
        select(func.count()).select_from(Interview)
    )).scalar_one()

    completed_interviews = (await session.execute(
        select(func.count()).select_from(Interview).where(Interview.status == "completed")
    )).scalar_one()

    candidates_with_ocean = (await session.execute(
        select(func.count()).select_from(Candidate).where(
            Candidate.ocean_scores.isnot(None)
        )
    )).scalar_one()

    recent_companies_rows = (await session.execute(
        select(Company).order_by(Company.created_at.desc()).limit(5)
    )).scalars().all()

    recent_candidates_rows = (await session.execute(
        select(Candidate).order_by(Candidate.created_at.desc()).limit(5)
    )).scalars().all()

    return AdminStatsResponse(
        total_companies=total_companies,
        total_candidates=total_candidates,
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        total_matches=total_matches,
        pending_matches=pending_matches,
        total_interviews=total_interviews,
        completed_interviews=completed_interviews,
        candidates_with_ocean=candidates_with_ocean,
        recent_companies=[
            RecentCompany(
                id=str(c.id),
                name=c.name,
                industry=c.industry,
                created_at=c.created_at.isoformat(),
            )
            for c in recent_companies_rows
        ],
        recent_candidates=[
            RecentCandidate(
                id=str(c.id),
                name=c.name,
                onboarding_completed=c.onboarding_completed,
                created_at=c.created_at.isoformat(),
            )
            for c in recent_candidates_rows
        ],
    )
