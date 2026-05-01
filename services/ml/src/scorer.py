from __future__ import annotations

import math
from dataclasses import dataclass


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


def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a ** 2 for a in v1))
    norm2 = math.sqrt(sum(b ** 2 for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


DIMENSION_WEIGHTS: dict[str, float] = {
    "openness": 1.0,
    "conscientiousness": 1.0,
    "extraversion": 0.8,
    "agreeableness": 0.9,
    "neuroticism": 1.1,
}


def compute_match_score(
    candidate_ocean: OCEANScores,
    company_ocean: OCEANScores,
) -> dict[str, float]:
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
