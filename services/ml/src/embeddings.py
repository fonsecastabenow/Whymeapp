from __future__ import annotations

import hashlib

_model = None


def _load_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        except ImportError:
            _model = "stub"
    return _model


def generate_embedding(text: str) -> list[float]:
    """Return a 384-dim embedding for the given text.

    Falls back to a deterministic stub when sentence-transformers is unavailable.
    """
    model = _load_model()

    if model == "stub":
        return _stub_embedding(text, dims=384)

    from sentence_transformers import SentenceTransformer
    assert isinstance(model, SentenceTransformer)
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def _stub_embedding(text: str, dims: int = 384) -> list[float]:
    digest = hashlib.sha256(text.encode()).digest()
    values: list[float] = []
    for i in range(dims):
        byte = digest[i % len(digest)]
        values.append((byte / 255.0) * 2 - 1)
    norm = sum(v ** 2 for v in values) ** 0.5 or 1.0
    return [v / norm for v in values]
