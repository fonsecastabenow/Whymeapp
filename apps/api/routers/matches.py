import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models.candidate import Candidate
from models.company import Company
from models.interview import Interview
from models.job import Job
from models.match import Match
from services.matching_service import compute_match_score
from services.notification_service import create_match_notifications

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/matches", tags=["matches"])

MATCH_THRESHOLD = 0.6

VALID_STATUS_UPDATES = {"pending", "accepted", "rejected"}


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class MatchOut(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    score: float
    ocean_breakdown: Optional[dict]
    status: str
    created_at: str


class TriggerMatchResponse(BaseModel):
    interview_id: str
    candidate_id: str
    matches_created: int
    matches: list[MatchOut]


class UpdateMatchStatusRequest(BaseModel):
    status: str


class UpdateMatchStatusResponse(BaseModel):
    id: str
    status: str
    message: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _match_to_out(m: Match) -> MatchOut:
    return MatchOut(
        id=str(m.id),
        job_id=str(m.job_id),
        candidate_id=str(m.candidate_id),
        score=m.score or 0.0,
        ocean_breakdown=m.ocean_breakdown,
        status=m.status,
        created_at=m.created_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/trigger/{interview_id}",
    response_model=TriggerMatchResponse,
    status_code=200,
)
async def trigger_matching(
    interview_id: str,
    threshold: float = Query(default=MATCH_THRESHOLD, ge=0.0, le=1.0),
    session: AsyncSession = Depends(get_session),
):
    """Run matching for a completed interview and create Match records."""
    result = await session.execute(
        select(Interview).where(Interview.id == interview_id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    if interview.status == "matched":
        # Already matched — return existing matches idempotently
        existing_result = await session.execute(
            select(Match).where(Match.candidate_id == interview.candidate_id)
        )
        existing = existing_result.scalars().all()
        return TriggerMatchResponse(
            interview_id=str(interview.id),
            candidate_id=str(interview.candidate_id),
            matches_created=0,
            matches=[_match_to_out(m) for m in existing],
        )

    if interview.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Interview must be in 'completed' status to trigger matching. "
                f"Current status: '{interview.status}'"
            ),
        )

    if not interview.candidate_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Interview has no linked candidate",
        )

    candidate_result = await session.execute(
        select(Candidate).where(Candidate.id == interview.candidate_id)
    )
    candidate = candidate_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    # Prefer candidate-level scores; fall back to interview scores
    candidate_scores = candidate.ocean_scores or interview.ocean_scores
    if not candidate_scores:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No OCEAN scores available on candidate or interview",
        )

    jobs_result = await session.execute(
        select(Job).where(Job.status == "active", Job.ocean_ideal.isnot(None))
    )
    jobs = jobs_result.scalars().all()

    created: list[Match] = []

    for job in jobs:
        score, breakdown = await compute_match_score(candidate_scores, job.ocean_ideal)

        if score < threshold:
            continue

        # Idempotency: skip if match already exists for this candidate+job
        existing_match_result = await session.execute(
            select(Match).where(
                Match.job_id == job.id,
                Match.candidate_id == candidate.id,
            )
        )
        existing_match = existing_match_result.scalar_one_or_none()
        if existing_match:
            created.append(existing_match)
            continue

        match = Match(
            job_id=job.id,
            candidate_id=candidate.id,
            score=score,
            ocean_breakdown=breakdown,
            status="pending",
        )
        session.add(match)
        await session.flush()
        await session.refresh(match)
        await create_match_notifications(
            session=session,
            match_id=match.id,
            job_id=job.id,
            candidate_id=candidate.id,
        )
        created.append(match)

    interview.status = "matched"
    await session.flush()

    logger.info(
        "Matching completed for interview %s: %d matches (threshold=%.2f)",
        interview_id,
        len(created),
        threshold,
    )

    return TriggerMatchResponse(
        interview_id=str(interview.id),
        candidate_id=str(candidate.id),
        matches_created=len(created),
        matches=[_match_to_out(m) for m in created],
    )


@router.get("/candidate/{candidate_id}", response_model=list[MatchOut])
async def list_matches_for_candidate(
    candidate_id: str,
    session: AsyncSession = Depends(get_session),
):
    """List all matches for a candidate."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid candidate_id format",
        )

    result = await session.execute(
        select(Match).where(Match.candidate_id == cand_uuid)
    )
    matches = result.scalars().all()
    return [_match_to_out(m) for m in matches]


# ---------------------------------------------------------------------------
# Pydantic schemas for enriched endpoints
# ---------------------------------------------------------------------------


class MatchDetailOut(BaseModel):
    id: str
    job_id: str
    job_title: str
    job_description: Optional[str]
    job_ocean_ideal: Optional[dict]
    company_id: str
    company_name: str
    company_industry: Optional[str]
    candidate_id: str
    score: float
    ocean_breakdown: Optional[dict]
    status: str
    created_at: str


class CandidateMatchOut(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    candidate_name: str
    candidate_headline: Optional[str]
    candidate_experience_years: Optional[float]
    candidate_skills: Optional[dict]
    candidate_ocean_scores: Optional[dict]
    score: float
    ocean_breakdown: Optional[dict]
    status: str
    created_at: str


class TopCandidateItem(BaseModel):
    candidate_id: str
    candidate_name: str
    score: float
    job_id: str
    job_title: str


class CompanySummaryOut(BaseModel):
    total_matches: int
    avg_match_score: float
    top_candidates: list[TopCandidateItem]
    matches_by_job: dict[str, int]


@router.get("/candidate/{candidate_id}/details", response_model=list[MatchDetailOut])
async def list_match_details_for_candidate(
    candidate_id: str,
    session: AsyncSession = Depends(get_session),
):
    """List matches for a candidate with full company and job info embedded."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid candidate_id format",
        )

    result = await session.execute(
        select(Match, Job, Company)
        .join(Job, Match.job_id == Job.id)
        .join(Company, Job.company_id == Company.id)
        .where(Match.candidate_id == cand_uuid)
        .order_by(Match.score.desc())
    )
    rows = result.all()

    return [
        MatchDetailOut(
            id=str(match.id),
            job_id=str(job.id),
            job_title=job.title,
            job_description=job.description,
            job_ocean_ideal=job.ocean_ideal,
            company_id=str(company.id),
            company_name=company.name,
            company_industry=company.industry,
            candidate_id=str(match.candidate_id),
            score=match.score or 0.0,
            ocean_breakdown=match.ocean_breakdown,
            status=match.status,
            created_at=match.created_at.isoformat(),
        )
        for match, job, company in rows
    ]


@router.get("/job/{job_id}", response_model=list[MatchOut])
async def list_matches_for_job(
    job_id: str,
    session: AsyncSession = Depends(get_session),
):
    """List all matches for a job."""
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid job_id format",
        )

    result = await session.execute(
        select(Match).where(Match.job_id == job_uuid)
    )
    matches = result.scalars().all()
    return [_match_to_out(m) for m in matches]


# ---------------------------------------------------------------------------
# Enriched endpoints
# ---------------------------------------------------------------------------


@router.get("/job/{job_id}/details", response_model=list[CandidateMatchOut])
async def list_matches_with_candidate_details(
    job_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Return matches for a job with full candidate info embedded."""
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid job_id format",
        )

    result = await session.execute(
        select(Match, Candidate)
        .join(Candidate, Match.candidate_id == Candidate.id)
        .where(Match.job_id == job_uuid)
        .order_by(Match.score.desc())
    )
    rows = result.all()

    return [
        CandidateMatchOut(
            id=str(m.id),
            job_id=str(m.job_id),
            candidate_id=str(m.candidate_id),
            candidate_name=c.name,
            candidate_headline=c.headline,
            candidate_experience_years=c.experience_years,
            candidate_skills=c.skills,
            candidate_ocean_scores=c.ocean_scores,
            score=m.score or 0.0,
            ocean_breakdown=m.ocean_breakdown,
            status=m.status,
            created_at=m.created_at.isoformat(),
        )
        for m, c in rows
    ]


@router.get("/company/{company_id}/summary", response_model=CompanySummaryOut)
async def get_company_matches_summary(
    company_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Aggregate match statistics for a company."""
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid company_id format",
        )

    jobs_result = await session.execute(
        select(Job).where(Job.company_id == company_uuid)
    )
    jobs = jobs_result.scalars().all()
    job_ids = [j.id for j in jobs]
    job_title_map = {str(j.id): j.title for j in jobs}

    if not job_ids:
        return CompanySummaryOut(
            total_matches=0,
            avg_match_score=0.0,
            top_candidates=[],
            matches_by_job={},
        )

    matches_result = await session.execute(
        select(Match, Candidate)
        .join(Candidate, Match.candidate_id == Candidate.id)
        .where(Match.job_id.in_(job_ids))
    )
    rows = matches_result.all()

    total = len(rows)
    avg_score = sum(m.score or 0.0 for m, _ in rows) / total if total else 0.0

    sorted_rows = sorted(rows, key=lambda r: r[0].score or 0.0, reverse=True)
    top_candidates = [
        TopCandidateItem(
            candidate_id=str(c.id),
            candidate_name=c.name,
            score=m.score or 0.0,
            job_id=str(m.job_id),
            job_title=job_title_map.get(str(m.job_id), ""),
        )
        for m, c in sorted_rows[:5]
    ]

    matches_by_job: dict[str, int] = {}
    for m, _ in rows:
        key = str(m.job_id)
        matches_by_job[key] = matches_by_job.get(key, 0) + 1

    return CompanySummaryOut(
        total_matches=total,
        avg_match_score=round(avg_score, 4),
        top_candidates=top_candidates,
        matches_by_job=matches_by_job,
    )


@router.patch("/{match_id}/status", response_model=UpdateMatchStatusResponse)
async def update_match_status(
    match_id: str,
    request: UpdateMatchStatusRequest,
    session: AsyncSession = Depends(get_session),
):
    """Update the status of a match (accepted/rejected)."""
    if request.status not in VALID_STATUS_UPDATES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status. Must be one of: {sorted(VALID_STATUS_UPDATES)}",
        )

    try:
        match_uuid = uuid.UUID(match_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid match_id format",
        )

    result = await session.execute(select(Match).where(Match.id == match_uuid))
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    match.status = request.status
    await session.flush()
    await session.refresh(match)

    return UpdateMatchStatusResponse(
        id=str(match.id),
        status=match.status,
        message=f"Match status updated to '{match.status}'",
    )
