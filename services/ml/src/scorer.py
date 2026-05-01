"""
Scorer OCEAN v2 — Whyme.

Computes OCEAN personality scores from questionnaire responses,
applies item reversal for (R) items, and computes match scores
using normalized euclidean distance converted to similarity (0-100%).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, asdict
from typing import Optional

import numpy as np


# ---------------------------------------------------------------------------
# Questionário config (30 perguntas, 6 por dimensão)
# ---------------------------------------------------------------------------

# Items marked (R) must be reversed: 6 - resposta
# 1-indexed question numbers that need reversal
REVERSED_ITEMS: set[int] = {3, 6, 9, 12, 14, 16, 18, 20, 22, 25, 27, 30}

# Mapping: question index (1-30) -> dimension name
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

DIMENSIONS = [
    "openness",
    "conscientiousness",
    "extraversion",
    "agreeableness",
    "neuroticism",
]

# Weights for computing the overall match score (weighted average of dim scores)
DIMENSION_WEIGHTS: dict[str, float] = {
    "openness": 1.0,
    "conscientiousness": 1.0,
    "extraversion": 0.8,
    "agreeableness": 0.9,
    "neuroticism": 1.1,
}


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------


@dataclass
class OCEANScores:
    openness: float
    conscientiousness: float
    extraversion: float
    agreeableness: float
    neuroticism: float

    def to_vector(self) -> list[float]:
        return [
            self.openness,
            self.conscientiousness,
            self.extraversion,
            self.agreeableness,
            self.neuroticism,
        ]

    def to_dict(self) -> dict[str, float]:
        return asdict(self)


@dataclass
class MatchResult:
    score: float  # overall match 0-100
    breakdown: dict[str, float]  # per-dimension match 0-100
    euclidean_distance: float  # raw normalized euclidean distance
    similarity: float  # converted similarity 0-100


# ---------------------------------------------------------------------------
# Scoring functions
# ---------------------------------------------------------------------------


def compute_ocean_score(respostas: list[int]) -> dict[str, float]:
    """Compute OCEAN scores (0-100) from a list of 30 questionnaire responses.

    Args:
        respostas: List of 30 integers (1-5 Likert scale).
                   Index 0 corresponds to question 1, index 29 to question 30.

    Returns:
        Dict with keys openness, conscientiousness, extraversion, agreeableness,
        neuroticism — each a float in [0, 100].
    """
    if len(respostas) != 30:
        raise ValueError(
            f"Expected 30 responses, got {len(respostas)}"
        )

    # Apply reversal for (R) items
    processed: list[int] = []
    for idx, raw in enumerate(respostas, start=1):
        raw_int = int(raw)
        if raw_int < 1 or raw_int > 5:
            raise ValueError(
                f"Response at question {idx} is {raw_int}, expected 1-5"
            )
        if idx in REVERSED_ITEMS:
            processed.append(6 - raw_int)  # reverse: 1->5, 2->4, 3->3, 4->2, 5->1
        else:
            processed.append(raw_int)

    # Group by dimension and compute mean, then scale to 0-100
    scores: dict[str, float] = {}
    for dim in DIMENSIONS:
        dim_indices = [
            i for i in range(30) if DIMENSION_MAP[i + 1] == dim
        ]
        raw_mean = sum(processed[i] for i in dim_indices) / len(dim_indices)
        # Scale from 1-5 to 0-100: (mean - 1) / (5 - 1) * 100
        scaled = ((raw_mean - 1.0) / 4.0) * 100.0
        # Clamp to [0, 100]
        scores[dim] = round(max(0.0, min(100.0, scaled)), 2)

    return scores


def compute_match(
    candidate_ocean: dict[str, float],
    company_ideal: dict[str, float],
) -> dict:
    """Compute match between a candidate's OCEAN profile and a company's ideal profile.

    Uses weighted RMS euclidean distance in normalized [0,1] space,
    converted to similarity (0-100%).

    Args:
        candidate_ocean: Dict with OCEAN scores (0-100), e.g. from compute_ocean_score.
        company_ideal: Dict with ideal OCEAN scores per dimension (0-100).

    Returns:
        Dict with:
            - score: overall match (0-100)
            - breakdown: per-dimension similarity (0-100)
            - euclidean_distance: weighted RMS distance (0-1, since dims in [0,1])
            - similarity: converted similarity percentage
    """
    dims = DIMENSIONS
    weights = [DIMENSION_WEIGHTS[d] for d in dims]

    c_vec = np.array([candidate_ocean.get(d, 50.0) for d in dims], dtype=float)
    j_vec = np.array([company_ideal.get(d, 50.0) for d in dims], dtype=float)

    # Normalize values to [0, 1] for distance computation
    c_norm = c_vec / 100.0
    j_norm = j_vec / 100.0

    # Per-dimension absolute differences in normalized space
    dim_diffs = np.abs(c_norm - j_norm)

    # Per-dimension similarity: 1 - distance, scaled to 0-100
    breakdown = {}
    for i, dim in enumerate(dims):
        sim = (1.0 - dim_diffs[i]) * 100.0
        breakdown[dim] = round(max(0.0, min(100.0, sim)), 2)

    # Weighted RMS distance across all dimensions.
    # Since each dimension is in [0,1], the RMS is naturally in [0,1].
    rms_distance = np.sqrt(
        np.sum(weights * (c_norm - j_norm) ** 2) / sum(weights)
    )
    rms_distance = float(min(rms_distance, 1.0))

    # Convert to similarity: 0-100%
    similarity = (1.0 - rms_distance) * 100.0
    overall_score = round(max(0.0, min(100.0, similarity)), 2)

    return {
        "score": overall_score,
        "breakdown": breakdown,
        "euclidean_distance": round(rms_distance, 4),
        "similarity": round(similarity, 2),
    }


# ---------------------------------------------------------------------------
# Legacy compatibility aliases
# ---------------------------------------------------------------------------


def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    """Legacy: cosine similarity between two vectors."""
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a ** 2 for a in v1))
    norm2 = math.sqrt(sum(b ** 2 for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


def compute_match_score(
    candidate_ocean: "OCEANScores",
    company_ocean: "OCEANScores",
) -> dict[str, float]:
    """Legacy: match score using cosine similarity (backward compatible)."""
    dims = list(DIMENSION_WEIGHTS.keys())
    weights = list(DIMENSION_WEIGHTS.values())

    c_vec = candidate_ocean.to_vector()
    j_vec = company_ocean.to_vector()

    weighted_c = [v * w for v, w in zip(c_vec, weights)]
    weighted_j = [v * w for v, w in zip(j_vec, weights)]

    overall = cosine_similarity(weighted_c, weighted_j)

    breakdown = {
        dim: 1.0 - abs(cv - jv)
        for dim, cv, jv in zip(dims, c_vec, j_vec)
    }

    return {"score": round(overall, 4), "breakdown": breakdown}
