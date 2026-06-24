"""
Celery task: trigger_matching

Runs automatically when an interview transitions to 'completed'.
Uses asyncio.run() to bridge sync Celery workers and async SQLAlchemy.
The task is idempotent: safe to enqueue multiple times for the same interview.
"""
import asyncio
import logging
from typing import Any

from celery_app import celery_app
from database import async_session_factory
from models.candidate import Candidate
from models.interview import Interview
from models.job import Job
from models.match import Match
from services.matching_service import MATCH_THRESHOLD, compute_match_score
from services.notification_service import create_match_notifications
from sqlalchemy import select

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="trigger_matching", max_retries=3)
def trigger_matching(self, interview_id: str, threshold: float = MATCH_THRESHOLD) -> dict[str, Any]:
    """
    Background task: compute OCEAN matches for a completed interview.

    Args:
        interview_id: UUID string of the interview to match.
        threshold: Minimum similarity score [0, 1] to create a match record.
    """
    logger.info("trigger_matching started: interview_id=%s threshold=%.2f", interview_id, threshold)
    try:
        return asyncio.run(_async_trigger_matching(interview_id, threshold))
    except Exception as exc:
        logger.error("trigger_matching failed for interview %s: %s", interview_id, exc)
        raise self.retry(exc=exc, countdown=60)


async def _async_trigger_matching(interview_id: str, threshold: float) -> dict[str, Any]:
    async with async_session_factory() as session:
        try:
            result = await session.execute(
                select(Interview).where(Interview.id == interview_id)
            )
            interview = result.scalar_one_or_none()

            if not interview:
                logger.warning("trigger_matching: interview %s not found", interview_id)
                return {"status": "not_found", "interview_id": interview_id}

            # Idempotency: already processed
            if interview.status == "matched":
                logger.info("trigger_matching: interview %s already matched", interview_id)
                return {"status": "already_matched", "interview_id": interview_id}

            if interview.status != "completed":
                logger.warning(
                    "trigger_matching: interview %s has status '%s', expected 'completed'",
                    interview_id,
                    interview.status,
                )
                return {
                    "status": "skipped",
                    "interview_id": interview_id,
                    "current_status": interview.status,
                }

            if not interview.candidate_id:
                logger.error("trigger_matching: interview %s has no candidate_id", interview_id)
                return {"status": "error", "message": "No candidate_id on interview"}

            candidate_result = await session.execute(
                select(Candidate).where(Candidate.id == interview.candidate_id)
            )
            candidate = candidate_result.scalar_one_or_none()
            if not candidate:
                logger.error("trigger_matching: candidate %s not found", interview.candidate_id)
                return {"status": "error", "message": "Candidate not found"}

            candidate_scores = candidate.ocean_scores or interview.ocean_scores
            if not candidate_scores:
                logger.error("trigger_matching: no OCEAN scores for interview %s", interview_id)
                return {"status": "error", "message": "No OCEAN scores available"}

            jobs_result = await session.execute(
                select(Job).where(Job.status == "active", Job.ocean_ideal.isnot(None))
            )
            jobs = jobs_result.scalars().all()

            match_ids: list[str] = []

            for job in jobs:
                score, breakdown = await compute_match_score(candidate_scores, job.ocean_ideal)

                if score < threshold:
                    continue

                # Idempotency: skip duplicate candidate+job pairs
                existing_result = await session.execute(
                    select(Match).where(
                        Match.job_id == job.id,
                        Match.candidate_id == candidate.id,
                    )
                )
                existing = existing_result.scalar_one_or_none()
                if existing:
                    match_ids.append(str(existing.id))
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
                match_ids.append(str(match.id))

            interview.status = "matched"
            await session.commit()

            logger.info(
                "trigger_matching completed: interview=%s matches=%d",
                interview_id,
                len(match_ids),
            )
            return {
                "status": "completed",
                "interview_id": interview_id,
                "matches_created": len(match_ids),
                "match_ids": match_ids,
            }

        except Exception:
            await session.rollback()
            raise
