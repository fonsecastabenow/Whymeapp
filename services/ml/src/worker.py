"""
Celery worker for ML tasks — Whyme.

Handles async processing: candidate embedding + OCEAN profile generation,
and batch matching for companies.
"""

from __future__ import annotations

import logging
from typing import Optional

from celery import Celery

from src.scorer import compute_ocean_score, compute_match
from src.embedding_service import get_embedding, get_company_culture_vector

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Celery app configuration
# ---------------------------------------------------------------------------

app = Celery(
    "whyme_ml",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------


@app.task(bind=True, max_retries=3, default_retry_delay=30)
def process_candidate(
    self,
    candidate_id: str,
    responses: list[int],
    answers: Optional[dict[str, str]] = None,
) -> dict:
    """Generate embedding + OCEAN profile for a candidate.

    Args:
        candidate_id: Unique candidate identifier.
        responses: List of 30 OCEAN questionnaire responses (1-5 Likert).
        answers: Optional dict of question -> answer text for embedding.

    Returns:
        Dict with candidate_id, ocean_profile, embedding, status.
    """
    logger.info("Processing candidate %s ...", candidate_id)

    try:
        # Compute OCEAN profile
        ocean_profile = compute_ocean_score(responses)
        logger.debug("Candidate %s OCEAN profile: %s", candidate_id, ocean_profile)

        # Generate embedding if answers provided
        embedding: Optional[list[float]] = None
        if answers:
            embedding = get_company_culture_vector(answers)
            logger.debug(
                "Candidate %s embedding generated (dim=%d)",
                candidate_id,
                len(embedding),
            )

        return {
            "candidate_id": candidate_id,
            "ocean_profile": ocean_profile,
            "embedding": embedding,
            "embedding_dim": len(embedding) if embedding else None,
            "status": "completed",
        }

    except Exception as exc:
        logger.exception("Failed to process candidate %s", candidate_id)
        raise self.retry(exc=exc)


@app.task(bind=True, max_retries=2, default_retry_delay=60)
def batch_match(
    self,
    company_id: str,
    company_ideal_ocean: dict[str, float],
    candidates: list[dict],
) -> dict:
    """Run matching for all candidates of a company.

    Args:
        company_id: Unique company identifier.
        company_ideal_ocean: Dict with ideal OCEAN scores for the company.
        candidates: List of dicts, each with at least 'candidate_id' and
                    'ocean_profile' keys.

    Returns:
        Dict with company_id, matches (list of candidate_id + score), summary.
    """
    logger.info(
        "Batch matching for company %s (%d candidates) ...",
        company_id,
        len(candidates),
    )

    matches: list[dict] = []
    scores: list[float] = []

    for cand in candidates:
        cand_id = cand.get("candidate_id", "unknown")
        cand_ocean = cand.get("ocean_profile")

        if not cand_ocean:
            logger.warning("Candidate %s missing ocean_profile, skipping", cand_id)
            continue

        try:
            result = compute_match(cand_ocean, company_ideal_ocean)
            matches.append(
                {
                    "candidate_id": cand_id,
                    "match_score": result["score"],
                    "breakdown": result["breakdown"],
                    "euclidean_distance": result["euclidean_distance"],
                }
            )
            scores.append(result["score"])
        except Exception as exc:
            logger.exception("Match failed for candidate %s", cand_id)

    # Sort by match score descending
    matches.sort(key=lambda m: m["match_score"], reverse=True)

    summary = {
        "total_candidates": len(candidates),
        "matched": len(matches),
        "average_score": round(sum(scores) / len(scores), 2) if scores else 0.0,
        "highest_score": round(max(scores), 2) if scores else 0.0,
        "lowest_score": round(min(scores), 2) if scores else 0.0,
    }

    return {
        "company_id": company_id,
        "matches": matches,
        "summary": summary,
        "status": "completed",
    }
