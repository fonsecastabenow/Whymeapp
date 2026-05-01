"""
Embedding service using neuralmind/bert-base-portuguese-cased.

Provides singleton model loading, text embedding (768-dim),
and company culture vector from questionnaire answers.
"""

from __future__ import annotations

import logging
from typing import Optional

import torch
import numpy as np

logger = logging.getLogger(__name__)

_MODEL = None
_TOKENIZER = None
_DEVICE: Optional[torch.device] = None

MODEL_NAME = "neuralmind/bert-base-portuguese-cased"
EMBEDDING_DIM = 768


def _load_model():
    """Singleton: load BERT-pt model and tokenizer once into GPU if available."""
    global _MODEL, _TOKENIZER, _DEVICE
    if _MODEL is not None:
        return _MODEL, _TOKENIZER, _DEVICE

    from transformers import AutoModel, AutoTokenizer

    _DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("Loading BERT-pt model '%s' on %s ...", MODEL_NAME, _DEVICE)

    _TOKENIZER = AutoTokenizer.from_pretrained(MODEL_NAME)
    _MODEL = AutoModel.from_pretrained(MODEL_NAME).to(_DEVICE)
    _MODEL.eval()

    logger.info("BERT-pt model loaded successfully (device=%s)", _DEVICE)
    return _MODEL, _TOKENIZER, _DEVICE


def get_embedding(text: str) -> list[float]:
    """Return a 768-dimensional embedding vector for the given text.

    Uses mean pooling on the last hidden state of BERT-pt.
    """
    model, tokenizer, device = _load_model()

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=512,
    ).to(device)

    with torch.no_grad():
        outputs = model(**inputs)

    # Mean pooling over token embeddings (excluding padding)
    attention_mask = inputs["attention_mask"]
    token_embeddings = outputs.last_hidden_state  # (1, seq_len, 768)

    mask = attention_mask.unsqueeze(-1).float()  # (1, seq_len, 1)
    masked = token_embeddings * mask
    summed = masked.sum(dim=1)  # (1, 768)
    counts = mask.sum(dim=1)  # (1, 768)
    mean_pooled = summed / counts.clamp(min=1e-9)

    # L2-normalize
    normalized = torch.nn.functional.normalize(mean_pooled, p=2, dim=1)

    return normalized.squeeze(0).cpu().tolist()


def get_company_culture_vector(answers: dict) -> list[float]:
    """Compute company culture vector from a dict of question -> answer text.

    Args:
        answers: Dictionary mapping question identifiers (str) to answer texts (str).
                 Example: {"Q1": "Sempre busco aprender coisas novas", "Q2": "..."}

    Returns:
        A 768-dimensional embedding vector (mean of all answer embeddings).
    """
    if not answers:
        logger.warning("Empty answers dict — returning zero vector")
        return [0.0] * EMBEDDING_DIM

    embeddings: list[list[float]] = []
    for q_id, answer_text in answers.items():
        if not answer_text or not isinstance(answer_text, str):
            logger.debug("Skipping empty answer for %s", q_id)
            continue
        emb = get_embedding(answer_text)
        embeddings.append(emb)

    if not embeddings:
        return [0.0] * EMBEDDING_DIM

    # Average all answer embeddings
    avg = np.mean(embeddings, axis=0).tolist()

    # L2-normalize the average
    norm = np.linalg.norm(avg)
    if norm > 0:
        avg = (np.array(avg) / norm).tolist()

    return avg


def clear_cache():
    """Clear the cached model (useful for testing)."""
    global _MODEL, _TOKENIZER, _DEVICE
    _MODEL = None
    _TOKENIZER = None
    _DEVICE = None
