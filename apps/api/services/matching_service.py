"""
OCEAN similarity computation with ML microservice fallback.

Score convention: all functions return values in [0, 1] range.
The ML service returns 0-100; we divide by 100 when using it.
"""
import logging
import math
from typing import Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)

OCEAN_DIMS = [
    "openness",
    "conscientiousness",
    "extraversion",
    "agreeableness",
    "neuroticism",
]

_SHORTHAND: dict[str, str] = {
    "o": "openness",
    "c": "conscientiousness",
    "e": "extraversion",
    "a": "agreeableness",
    "n": "neuroticism",
}

_WEIGHTS: dict[str, float] = {
    "openness": 1.0,
    "conscientiousness": 1.0,
    "extraversion": 0.8,
    "agreeableness": 0.9,
    "neuroticism": 1.1,
}

_TOTAL_WEIGHT = sum(_WEIGHTS.values())

ML_SERVICE_URL = getattr(settings, "ml_service_url", "http://localhost:8001")

MATCH_THRESHOLD = 0.6


def _expand_and_normalize(scores: dict) -> dict[str, float]:
    """Expand shorthand keys and normalize values to [0, 1]."""
    expanded: dict[str, float] = {}
    for k, v in scores.items():
        key = _SHORTHAND.get(k.lower(), k.lower())
        expanded[key] = float(v)

    # If any value exceeds 1.0, assume 0-100 scale and convert
    if expanded and max(expanded.values()) > 1.0:
        expanded = {k: v / 100.0 for k, v in expanded.items()}

    # Fill missing dimensions with 0.5 (neutral midpoint)
    return {dim: expanded.get(dim, 0.5) for dim in OCEAN_DIMS}


def compute_ocean_similarity(candidate_scores: dict, job_ideal: dict) -> float:
    """
    Compute OCEAN similarity between a candidate profile and a job ideal.

    Accepts flexible key formats (full names or single-letter shorthands o/c/e/a/n)
    and value ranges (0-1 or 0-100). Missing dimensions default to 0.5.

    Returns:
        Similarity in [0, 1]; higher is a better match.
    """
    c = _expand_and_normalize(candidate_scores)
    j = _expand_and_normalize(job_ideal)

    weighted_sq_sum = sum(_WEIGHTS[d] * (c[d] - j[d]) ** 2 for d in OCEAN_DIMS)
    rms_distance = math.sqrt(weighted_sq_sum / _TOTAL_WEIGHT)
    rms_distance = min(rms_distance, 1.0)

    return round(1.0 - rms_distance, 4)


def compute_ocean_breakdown(candidate_scores: dict, job_ideal: dict) -> dict[str, float]:
    """Per-dimension similarity in [0, 100] range."""
    c = _expand_and_normalize(candidate_scores)
    j = _expand_and_normalize(job_ideal)
    return {
        dim: round((1.0 - abs(c[dim] - j[dim])) * 100.0, 2)
        for dim in OCEAN_DIMS
    }


async def _call_ml_service(candidate_scores: dict, job_ideal: dict) -> Optional[dict]:
    """POST to /match on the ML microservice. Returns None on any error."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{ML_SERVICE_URL}/match",
                json={
                    "candidate_ocean": candidate_scores,
                    "company_ideal": job_ideal,
                },
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception as exc:
        logger.warning("ML service unavailable, using local fallback: %s", exc)
    return None


async def compute_match_score(
    candidate_scores: dict,
    job_ideal: dict,
) -> tuple[float, dict[str, float]]:
    """
    Compute (score, breakdown) using ML service when available, local fallback otherwise.

    Returns:
        score: float in [0, 1]
        breakdown: dict[dimension, float] in [0, 100]
    """
    result = await _call_ml_service(candidate_scores, job_ideal)
    if result is not None:
        score = result["score"] / 100.0
        breakdown = result.get("breakdown", {})
        return round(score, 4), breakdown

    score = compute_ocean_similarity(candidate_scores, job_ideal)
    breakdown = compute_ocean_breakdown(candidate_scores, job_ideal)
    return score, breakdown
