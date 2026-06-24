"""Tests for the OCEAN matching engine."""

import pytest
from services.matching_service import (
    compute_ocean_similarity,
    compute_ocean_breakdown,
    compute_match_score,
)


# ============================================================
# compute_ocean_similarity
# ============================================================


class TestComputeOceanSimilarity:
    """Tests for compute_ocean_similarity()."""

    def test_identical_profiles_score_one(self, identical_profiles):
        """Identical profiles should yield similarity ~1.0."""
        a, b = identical_profiles
        score = compute_ocean_similarity(a, b)
        assert score == pytest.approx(1.0, abs=1e-4)

    def test_opposite_profiles_score_zero(self, opposite_profiles):
        """Opposite profiles should yield similarity ~0.0."""
        a, b = opposite_profiles
        score = compute_ocean_similarity(a, b)
        assert score == pytest.approx(0.0, abs=1e-2)
        assert 0.0 <= score <= 0.01

    def test_partial_overlap_intermediate(self, partial_overlap):
        """Partially overlapping profiles should yield score between 0.3 and 0.7."""
        a, b = partial_overlap
        score = compute_ocean_similarity(a, b)
        assert 0.3 <= score <= 0.7, f"Expected intermediate score, got {score}"

    def test_missing_dimensions_default(self):
        """Missing dimensions should default to 0.5 in similarity."""
        candidate = {"openness": 0.9, "conscientiousness": 0.8}
        job_ideal = {"openness": 0.9, "conscientiousness": 0.8}
        score = compute_ocean_similarity(candidate, job_ideal)
        # Missing dims default to 0.5, which will lower the score
        assert 0.0 <= score <= 1.0
        # With 3 dims at 0.5 vs 0.5 (same), and 2 dims at 0.9 vs 0.9, score < 1.0
        # because the 3 missing dims contribute 0 difference
        # Actually they're the same (both default to 0.5) so diff=0, score should be ~1.0
        assert score == pytest.approx(1.0, abs=1e-4)

    def test_different_key_cases(self):
        """Shorthand keys ('o', 'c', 'e', 'a', 'n') should match full names."""
        with_full = {
            "openness": 0.8,
            "conscientiousness": 0.7,
            "extraversion": 0.3,
            "agreeableness": 0.9,
            "neuroticism": 0.2,
        }
        with_shorthand = {"o": 0.8, "c": 0.7, "e": 0.3, "a": 0.9, "n": 0.2}

        score_full = compute_ocean_similarity(with_full, with_full)
        score_shorthand = compute_ocean_similarity(with_shorthand, with_shorthand)
        assert score_full == score_shorthand

    def test_different_key_cases_cross(self):
        """Mixing shorthand in candidate and full in job_ideal should give same result."""
        with_full = {
            "openness": 0.8,
            "conscientiousness": 0.7,
            "extraversion": 0.3,
            "agreeableness": 0.9,
            "neuroticism": 0.2,
        }
        with_shorthand = {"o": 0.8, "c": 0.7, "e": 0.3, "a": 0.9, "n": 0.2}

        score1 = compute_ocean_similarity(with_full, with_full)
        score2 = compute_ocean_similarity(with_shorthand, with_full)
        assert score1 == pytest.approx(score2, abs=1e-4)

    def test_weighted_dimensions(self):
        """Custom weights should produce different result from uniform weighting.

        This test verifies that the internal weight dict is being used.
        """
        # neuroticism has weight 1.1, extraversion has weight 0.8
        # So same diff in neuroticism matters more than same diff in extraversion
        profile_a = {
            "openness": 0.5,
            "conscientiousness": 0.5,
            "extraversion": 0.5,
            "agreeableness": 0.5,
            "neuroticism": 0.5,
        }
        profile_b = {
            "openness": 0.5,
            "conscientiousness": 0.5,
            "extraversion": 0.5,
            "agreeableness": 0.5,
            "neuroticism": 0.8,
        }
        profile_c = {
            "openness": 0.5,
            "conscientiousness": 0.5,
            "extraversion": 0.8,
            "agreeableness": 0.5,
            "neuroticism": 0.5,
        }

        score_b = compute_ocean_similarity(profile_a, profile_b)
        score_c = compute_ocean_similarity(profile_a, profile_c)

        # Both have a 0.3 diff in one dim, but neuroticism is weighted higher (1.1)
        # than extraversion (0.8), so score_b should be lower than score_c
        assert score_b < score_c, (
            f"Expected weighted dims: score_b({score_b}) < score_c({score_c})"
        )

    def test_score_range(self):
        """Score should always be in [0, 1] for various combos."""
        combos = [
            ({"o": 1.0, "c": 1.0, "e": 1.0, "a": 1.0, "n": 1.0},
             {"o": 0.0, "c": 0.0, "e": 0.0, "a": 0.0, "n": 0.0}),
            ({"o": 0.0, "c": 0.0, "e": 0.0, "a": 0.0, "n": 0.0},
             {"o": 1.0, "c": 1.0, "e": 1.0, "a": 1.0, "n": 1.0}),
            ({"o": 0.33, "c": 0.67, "n": 0.5}, {"e": 0.9, "a": 0.1}),
            ({"openness": 0.9, "conscientiousness": 0.2}, {"o": 0.1, "c": 0.8}),
            ({"o": 0}, {"e": 0}),
        ]
        for cand, job in combos:
            score = compute_ocean_similarity(cand, job)
            assert 0.0 <= score <= 1.0, (
                f"Score {score} out of [0,1] for cand={cand}, job={job}"
            )

    def test_100_scale_auto_normalize(self):
        """Values in 0-100 range should be auto-normalized to 0-1."""
        cand = {"o": 80, "c": 70, "e": 30, "a": 90, "n": 20}
        job = {"o": 80, "c": 70, "e": 30, "a": 90, "n": 20}
        score = compute_ocean_similarity(cand, job)
        assert score == pytest.approx(1.0, abs=1e-4)


# ============================================================
# compute_ocean_breakdown
# ============================================================


class TestComputeOceanBreakdown:
    """Tests for compute_ocean_breakdown()."""

    def test_identical_breakdown_all_100(self, identical_profiles):
        """Identical profiles should have each dimension = 100."""
        a, b = identical_profiles
        breakdown = compute_ocean_breakdown(a, b)
        for dim, val in breakdown.items():
            assert val == pytest.approx(100.0, abs=1e-2), (
                f"Dimension '{dim}' should be ~100, got {val}"
            )

    def test_opposite_breakdown_all_0(self, opposite_profiles):
        """Opposite profiles should have each dimension ≈ 0."""
        a, b = opposite_profiles
        breakdown = compute_ocean_breakdown(a, b)
        for dim, val in breakdown.items():
            assert val == pytest.approx(0.0, abs=10.0), (
                f"Dimension '{dim}' should be ≈0, got {val}"
            )
            assert 0.0 <= val <= 100.0

    def test_breakdown_valid_range(self, ocean_profile, ocean_ideal):
        """Each dimension score should be in [0, 100]."""
        breakdown = compute_ocean_breakdown(ocean_profile, ocean_ideal)
        for dim, val in breakdown.items():
            assert 0.0 <= val <= 100.0, (
                f"Breakdown '{dim}' = {val} out of [0, 100]"
            )

    def test_breakdown_has_all_five_keys(self, ocean_profile, ocean_ideal):
        """Returned breakdown dict should have exactly 5 OCEAN keys."""
        breakdown = compute_ocean_breakdown(ocean_profile, ocean_ideal)
        expected_keys = {
            "openness",
            "conscientiousness",
            "extraversion",
            "agreeableness",
            "neuroticism",
        }
        assert set(breakdown.keys()) == expected_keys, (
            f"Expected keys {expected_keys}, got {set(breakdown.keys())}"
        )
        assert len(breakdown) == 5

    def test_breakdown_missing_dims(self):
        """Missing dimensions default to 0.5, so diff with same default is 0 → score 100."""
        breakdown = compute_ocean_breakdown({"openness": 0.9}, {"openness": 0.9})
        assert breakdown["openness"] == pytest.approx(100.0, abs=1e-2)
        # Missing dims default to 0.5 in both, diff = 0
        for dim in ["conscientiousness", "extraversion", "agreeableness", "neuroticism"]:
            assert breakdown[dim] == pytest.approx(100.0, abs=1e-2)


# ============================================================
# compute_match_score
# ============================================================


class TestComputeMatchScore:
    """Tests for compute_match_score()."""

    @pytest.mark.asyncio
    async def test_match_score_returns_tuple(self, ocean_profile, ocean_ideal):
        """compute_match_score should return a tuple with 2 elements."""
        result = await compute_match_score(ocean_profile, ocean_ideal)
        assert isinstance(result, tuple), f"Expected tuple, got {type(result)}"
        assert len(result) == 2, f"Expected 2 elements, got {len(result)}"

    @pytest.mark.asyncio
    async def test_match_score_local_fallback(self, ocean_profile, ocean_ideal):
        """When ML service is unavailable, should use local fallback and return valid result."""
        # No ML service running locally, so it falls back
        result = await compute_match_score(ocean_profile, ocean_ideal)
        score, breakdown = result
        assert 0.0 <= score <= 1.0, f"Score {score} out of [0, 1]"
        assert isinstance(breakdown, dict)
        assert len(breakdown) == 5

    @pytest.mark.asyncio
    async def test_match_score_breakdown_type(self, ocean_profile, ocean_ideal):
        """The breakdown should be a dict with 5 OCEAN keys."""
        _, breakdown = await compute_match_score(ocean_profile, ocean_ideal)
        expected_keys = {
            "openness",
            "conscientiousness",
            "extraversion",
            "agreeableness",
            "neuroticism",
        }
        assert isinstance(breakdown, dict), f"Expected dict, got {type(breakdown)}"
        assert set(breakdown.keys()) == expected_keys, (
            f"Expected keys {expected_keys}, got {set(breakdown.keys())}"
        )

    @pytest.mark.asyncio
    async def test_match_score_consistency(self, identical_profiles):
        """Local fallback should give same result as calling compute_ocean_similarity directly."""
        a, b = identical_profiles
        score, breakdown = await compute_match_score(a, b)

        expected_score = compute_ocean_similarity(a, b)
        expected_breakdown = compute_ocean_breakdown(a, b)

        assert score == pytest.approx(expected_score, abs=1e-4), (
            f"Score mismatch: {score} vs {expected_score}"
        )
        for dim in expected_breakdown:
            assert breakdown[dim] == pytest.approx(expected_breakdown[dim], abs=1e-2), (
                f"Breakdown '{dim}' mismatch: {breakdown[dim]} vs {expected_breakdown[dim]}"
            )

    @pytest.mark.asyncio
    async def test_match_score_identical_profiles(self, identical_profiles):
        """Identical profiles via match_score should yield score ~1.0."""
        a, b = identical_profiles
        score, _ = await compute_match_score(a, b)
        assert score == pytest.approx(1.0, abs=1e-4)

    @pytest.mark.asyncio
    async def test_match_score_breakdown_values_in_range(self, ocean_profile, ocean_ideal):
        """Breakdown values should be in [0, 100]."""
        _, breakdown = await compute_match_score(ocean_profile, ocean_ideal)
        for dim, val in breakdown.items():
            assert 0.0 <= val <= 100.0, (
                f"Breakdown '{dim}' = {val} out of [0, 100]"
            )
