"""
Unit tests for the OCEAN v2 scorer.

Tests: dimension mapping, item reversal, scoring range, match computation.
"""

from __future__ import annotations

import math

import pytest
import numpy as np

from src.scorer import (
    compute_ocean_score,
    compute_match,
    REVERSED_ITEMS,
    DIMENSION_MAP,
    DIMENSIONS,
    DIMENSION_WEIGHTS,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def neutral_responses() -> list[int]:
    """All responses = 3 (neutral on Likert scale)."""
    return [3] * 30


@pytest.fixture
def max_responses() -> list[int]:
    """All max (5)."""
    return [5] * 30


@pytest.fixture
def min_responses() -> list[int]:
    """All min (1)."""
    return [1] * 30


@pytest.fixture
def realistic_responses() -> list[int]:
    """Realistic varied responses."""
    return [
        # Openness (Q1-Q6): 4,5,2,4,5,3
        4, 5, 2, 4, 5, 3,
        # Conscientiousness (Q7-Q12): 5,4,2,5,4,1
        5, 4, 2, 5, 4, 1,
        # Extraversion (Q13-Q18): 4,2,3,2,3,2
        4, 2, 3, 2, 3, 2,
        # Agreeableness (Q19-Q24): 5,2,4,3,4,3
        5, 2, 4, 3, 4, 3,
        # Neuroticism (Q25-Q30): 2,4,3,3,2,3
        2, 4, 3, 3, 2, 3,
    ]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _expected_dim_score(responses: list[int], dim: str) -> float:
    """Compute expected score for a dimension given raw responses."""
    indices = [i for i in range(30) if DIMENSION_MAP[i + 1] == dim]
    processed = []
    for idx, raw in enumerate(responses, start=1):
        raw_int = int(raw)
        if idx in REVERSED_ITEMS:
            processed.append(6 - raw_int)
        else:
            processed.append(raw_int)
    raw_mean = sum(processed[i] for i in indices) / len(indices)
    return round(((raw_mean - 1.0) / 4.0) * 100.0, 2)


# ---------------------------------------------------------------------------
# Tests: score computation
# ---------------------------------------------------------------------------


class TestComputeOceanScore:
    def test_neutral_all_three(self, neutral_responses):
        """All 3s -> after reversal, still 3 for all -> 50 in each dim."""
        scores = compute_ocean_score(neutral_responses)
        for dim in DIMENSIONS:
            assert dim in scores
            assert scores[dim] == 50.0, f"{dim} expected 50, got {scores[dim]}"

    def test_max_all_five(self, max_responses):
        """All 5s — validate against computed expectation per dimension."""
        scores = compute_ocean_score(max_responses)
        for dim in DIMENSIONS:
            expected = _expected_dim_score(max_responses, dim)
            assert scores[dim] == expected, (
                f"{dim} expected {expected}, got {scores[dim]}"
            )

    def test_min_all_one(self, min_responses):
        """All 1s — validate against computed expectation per dimension."""
        scores = compute_ocean_score(min_responses)
        for dim in DIMENSIONS:
            expected = _expected_dim_score(min_responses, dim)
            assert scores[dim] == expected, (
                f"{dim} expected {expected}, got {scores[dim]}"
            )

    def test_reversed_items_inversion(self):
        """Test that (R) items are properly inverted."""
        # Response where reversed items are 5 and non-reversed are 1
        responses = [1] * 30
        for idx in REVERSED_ITEMS:
            responses[idx - 1] = 5
        # After processing: reversed items become 1, non-reversed stay 1
        # All processed values are 1 -> scaled = 0
        scores = compute_ocean_score(responses)
        for dim in DIMENSIONS:
            assert scores[dim] == 0.0, f"{dim} expected 0, got {scores[dim]}"

        # Inverse: reversed items = 1, non-reversed = 5
        responses2 = [5] * 30
        for idx in REVERSED_ITEMS:
            responses2[idx - 1] = 1
        # After processing: reversed become 5, non-reversed stay 5
        # All processed values are 5 -> scaled = 100
        scores2 = compute_ocean_score(responses2)
        for dim in DIMENSIONS:
            assert scores2[dim] == 100.0, f"{dim} expected 100, got {scores2[dim]}"

    def test_wrong_length_raises(self):
        """Must have exactly 30 responses."""
        with pytest.raises(ValueError, match="30"):
            compute_ocean_score([1, 2, 3])

    def test_out_of_range_raises(self):
        """Values must be 1-5."""
        with pytest.raises(ValueError, match="1-5"):
            compute_ocean_score([0] + [3] * 29)

        with pytest.raises(ValueError, match="1-5"):
            compute_ocean_score([6] + [3] * 29)

    def test_realistic_scores(self, realistic_responses):
        """Smoke test: realistic profile returns valid scores."""
        scores = compute_ocean_score(realistic_responses)
        for dim in DIMENSIONS:
            assert dim in scores
            assert 0.0 <= scores[dim] <= 100.0, f"{dim} out of range: {scores[dim]}"

    def test_score_precision(self):
        """Scores should be rounded to 2 decimal places."""
        responses = [3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4,
                     3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4,
                     3, 4, 3, 4, 3, 4]
        scores = compute_ocean_score(responses)
        for dim in DIMENSIONS:
            score_str = str(scores[dim])
            if "." in score_str:
                decimals = len(score_str.split(".")[1])
                assert decimals <= 2, f"{dim} has {decimals} decimals"


# ---------------------------------------------------------------------------
# Tests: dimension mapping
# ---------------------------------------------------------------------------


class TestDimensionMapping:
    def test_all_30_questions_mapped(self):
        """Every question 1-30 has a dimension."""
        for i in range(1, 31):
            assert i in DIMENSION_MAP, f"Question {i} not mapped"

    def test_six_per_dimension(self):
        """Each dimension has exactly 6 questions."""
        for dim in DIMENSIONS:
            count = sum(1 for v in DIMENSION_MAP.values() if v == dim)
            assert count == 6, f"{dim} has {count} questions, expected 6"

    def test_reversed_items_accounted(self):
        """All 12 reversed items are in the set, distributed correctly."""
        assert len(REVERSED_ITEMS) == 12
        for idx in REVERSED_ITEMS:
            assert 1 <= idx <= 30
            assert idx in DIMENSION_MAP

    def test_each_dim_has_correct_reversed_count(self):
        """Openness=2, Consc=2, Extra=3, Agree=2, Neurot=3."""
        dim_rev_count: dict[str, int] = {}
        for idx in REVERSED_ITEMS:
            dim = DIMENSION_MAP[idx]
            dim_rev_count[dim] = dim_rev_count.get(dim, 0) + 1
        assert dim_rev_count.get("openness", 0) == 2
        assert dim_rev_count.get("conscientiousness", 0) == 2
        assert dim_rev_count.get("extraversion", 0) == 3
        assert dim_rev_count.get("agreeableness", 0) == 2
        assert dim_rev_count.get("neuroticism", 0) == 3


# ---------------------------------------------------------------------------
# Tests: match computation
# ---------------------------------------------------------------------------


class TestComputeMatch:
    def test_perfect_match(self):
        """Identical profiles should give 100% match."""
        candidate = {d: 75.0 for d in DIMENSIONS}
        company = {d: 75.0 for d in DIMENSIONS}
        result = compute_match(candidate, company)
        assert result["score"] == 100.0
        for dim in DIMENSIONS:
            assert result["breakdown"][dim] == 100.0
        assert result["euclidean_distance"] == 0.0
        assert result["similarity"] == 100.0

    def test_opposite_match(self):
        """Opposite profiles (100 vs 0) should give 0% match."""
        candidate = {d: 100.0 for d in DIMENSIONS}
        company = {d: 0.0 for d in DIMENSIONS}
        result = compute_match(candidate, company)
        assert result["score"] == 0.0
        for dim in DIMENSIONS:
            assert result["breakdown"][dim] == 0.0
        assert result["euclidean_distance"] == 1.0
        assert result["similarity"] == 0.0

    def test_partial_match(self):
        """50% difference should yield 50% match."""
        candidate = {d: 50.0 for d in DIMENSIONS}
        company = {d: 75.0 for d in DIMENSIONS}
        result = compute_match(candidate, company)
        # RMS diff = 0.25 -> similarity = 75%
        assert result["score"] == 75.0
        assert result["euclidean_distance"] == 0.25
        for dim in DIMENSIONS:
            assert result["breakdown"][dim] == 75.0

    def test_weighted_dimensions(self):
        """Dimensions with higher weight affect overall score more."""
        # Candidate matches on all except neuroticism (highest weight)
        candidate = {"openness": 80.0, "conscientiousness": 80.0,
                     "extraversion": 80.0, "agreeableness": 80.0,
                     "neuroticism": 20.0}
        company = {"openness": 80.0, "conscientiousness": 80.0,
                   "extraversion": 80.0, "agreeableness": 80.0,
                   "neuroticism": 80.0}
        result = compute_match(candidate, company)
        # Neuroticism diff = 0.6, weighted by 1.1
        # RMS = sqrt((4*1*0 + 1.1*0.36) / (4*1 + 1.1))
        # = sqrt(0.396 / 5.1) = sqrt(0.0776) ≈ 0.2786
        # Similarity = (1 - 0.2786) * 100 ≈ 72.14
        assert result["score"] < 100.0
        assert result["breakdown"]["neuroticism"] < 100.0
        # Other dims should be 100
        assert result["breakdown"]["openness"] == 100.0
        assert result["breakdown"]["conscientiousness"] == 100.0

    def test_missing_dimension_fallsback(self):
        """Missing dims should fallback to 50.0."""
        candidate = {"openness": 100.0, "conscientiousness": 100.0,
                     "extraversion": 100.0, "agreeableness": 100.0}
        company = {d: 0.0 for d in DIMENSIONS}
        result = compute_match(candidate, company)
        assert "neuroticism" in result["breakdown"]
        # candidate neuroticism defaults to 50, company is 0
        # diff = 0.5 -> breakdown = 50
        assert result["breakdown"]["neuroticism"] == 50.0

    def test_breakdown_precision(self):
        """Breakdown values are rounded to 2 decimals."""
        candidate = {d: 33.33 for d in DIMENSIONS}
        company = {d: 66.67 for d in DIMENSIONS}
        result = compute_match(candidate, company)
        for dim, val in result["breakdown"].items():
            val_str = str(val)
            if "." in val_str:
                decimals = len(val_str.split(".")[1])
                assert decimals <= 2, f"{dim} has {decimals} decimals"
