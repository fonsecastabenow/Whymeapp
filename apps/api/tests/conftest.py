"""Fixtures for matching engine tests with synthetic OCEAN data."""

import pytest


@pytest.fixture(scope="function")
def ocean_profile() -> dict:
    """A realistic candidate OCEAN profile with values in [0, 1]."""
    return {
        "openness": 0.8,
        "conscientiousness": 0.7,
        "extraversion": 0.3,
        "agreeableness": 0.9,
        "neuroticism": 0.2,
    }


@pytest.fixture(scope="function")
def ocean_ideal() -> dict:
    """A job ideal OCEAN profile with values in [0, 1]."""
    return {
        "openness": 0.7,
        "conscientiousness": 0.6,
        "extraversion": 0.4,
        "agreeableness": 0.8,
        "neuroticism": 0.1,
    }


@pytest.fixture(scope="function")
def identical_profiles() -> tuple[dict, dict]:
    """Two identical OCEAN profiles — should yield similarity 1.0."""
    profile = {
        "openness": 0.8,
        "conscientiousness": 0.7,
        "extraversion": 0.3,
        "agreeableness": 0.9,
        "neuroticism": 0.2,
    }
    return profile, dict(profile)


@pytest.fixture(scope="function")
def opposite_profiles() -> tuple[dict, dict]:
    """Two opposite OCEAN profiles — each dimension at extreme poles (0 vs 1)."""
    a = {
        "openness": 1.0,
        "conscientiousness": 1.0,
        "extraversion": 1.0,
        "agreeableness": 1.0,
        "neuroticism": 1.0,
    }
    b = {
        "openness": 0.0,
        "conscientiousness": 0.0,
        "extraversion": 0.0,
        "agreeableness": 0.0,
        "neuroticism": 0.0,
    }
    return a, b


@pytest.fixture(scope="function")
def partial_overlap() -> tuple[dict, dict]:
    """Two OCEAN profiles with partial overlap — intermediate similarity."""
    a = {
        "openness": 0.8,
        "conscientiousness": 0.7,
        "extraversion": 0.3,
        "agreeableness": 0.9,
        "neuroticism": 0.2,
    }
    b = {
        "openness": 0.4,
        "conscientiousness": 0.5,
        "extraversion": 0.7,
        "agreeableness": 0.3,
        "neuroticism": 0.6,
    }
    return a, b
