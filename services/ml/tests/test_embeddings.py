"""
Basic tests for the embedding service.

Tests stub behavior when model is unavailable and validates
embedding dimensions and normalization.
"""

from __future__ import annotations

import pytest

from src.embedding_service import (
    get_embedding,
    get_company_culture_vector,
    clear_cache,
    EMBEDDING_DIM,
)


@pytest.fixture(autouse=True)
def reset_cache():
    """Clear model cache before each test to ensure clean state."""
    clear_cache()
    yield
    clear_cache()


# ---------------------------------------------------------------------------
# Tests: embedding
# ---------------------------------------------------------------------------


class TestGetEmbedding:
    def test_embedding_dimension(self):
        """Embedding should be 768-dimensional."""
        emb = get_embedding("Teste de texto simples.")
        assert len(emb) == EMBEDDING_DIM, f"Expected {EMBEDDING_DIM}, got {len(emb)}"

    def test_embedding_values(self):
        """Embedding should contain floats."""
        emb = get_embedding("Outro texto para teste.")
        for val in emb:
            assert isinstance(val, float), f"Expected float, got {type(val)}"

    def test_embedding_not_zero(self):
        """Non-empty text should produce non-zero embedding."""
        emb = get_embedding("Um texto com algum conteúdo relevante.")
        assert any(abs(v) > 1e-6 for v in emb), "Embedding is all zeros"

    def test_embedding_normalized(self):
        """Embedding should be L2-normalized (unit vector)."""
        emb = get_embedding("Teste de normalização do embedding.")
        norm_sq = sum(v * v for v in emb)
        # Should be close to 1.0 (allowing floating point error)
        assert abs(norm_sq - 1.0) < 1e-4, f"L2 norm squared = {norm_sq}, expected ~1.0"

    def test_similar_texts_similar_embeddings(self):
        """Similar texts should have similar embeddings."""
        emb1 = get_embedding("Eu gosto de programar em Python.")
        emb2 = get_embedding("Eu adoro programar em Python.")
        emb3 = get_embedding("O céu está azul hoje.")

        # Compute cosine similarity
        def cosine_sim(a, b):
            dot = sum(x * y for x, y in zip(a, b))
            return dot  # since both are normalized

        sim_similar = cosine_sim(emb1, emb2)
        sim_different = cosine_sim(emb1, emb3)

        assert sim_similar > sim_different, (
            f"Similar texts ({sim_similar:.4f}) should be more similar "
            f"than different texts ({sim_different:.4f})"
        )

    def test_empty_text(self):
        """Empty text should still produce a valid embedding."""
        emb = get_embedding("")
        assert len(emb) == EMBEDDING_DIM


# ---------------------------------------------------------------------------
# Tests: company culture vector
# ---------------------------------------------------------------------------


class TestGetCompanyCultureVector:
    def test_single_answer(self):
        """Single answer should produce valid embedding."""
        answers = {"Q1": "Valorizamos inovação e criatividade."}
        vec = get_company_culture_vector(answers)
        assert len(vec) == EMBEDDING_DIM
        norm_sq = sum(v * v for v in vec)
        assert abs(norm_sq - 1.0) < 1e-4, f"L2 norm squared = {norm_sq}"

    def test_multiple_answers(self):
        """Multiple answers should produce averaged embedding."""
        answers = {
            "Q1": "Trabalhamos em equipe.",
            "Q2": "Buscamos excelência.",
            "Q3": "Inovamos constantemente.",
        }
        vec = get_company_culture_vector(answers)
        assert len(vec) == EMBEDDING_DIM

    def test_empty_answers(self):
        """Empty dict should return zero vector."""
        vec = get_company_culture_vector({})
        assert len(vec) == EMBEDDING_DIM
        assert all(v == 0.0 for v in vec)

    def test_answers_with_empty_values(self):
        """Dict with empty strings should handle gracefully."""
        answers = {"Q1": "", "Q2": "Apenas uma resposta válida."}
        vec = get_company_culture_vector(answers)
        assert len(vec) == EMBEDDING_DIM
        norm_sq = sum(v * v for v in vec)
        assert abs(norm_sq - 1.0) < 1e-4

    def test_deterministic(self):
        """Same input should produce same output."""
        answers = {"Q1": "Cultura de inovação."}
        vec1 = get_company_culture_vector(answers)
        vec2 = get_company_culture_vector(answers)
        assert vec1 == vec2, "Embeddings should be deterministic"


# ---------------------------------------------------------------------------
# Tests: clear_cache
# ---------------------------------------------------------------------------


class TestCache:
    def test_clear_cache_reloads(self):
        """Clear cache should allow re-loading the model."""
        emb1 = get_embedding("Teste antes do cache.")
        clear_cache()
        emb2 = get_embedding("Teste depois do cache.")
        assert len(emb1) == EMBEDDING_DIM
        assert len(emb2) == EMBEDDING_DIM
