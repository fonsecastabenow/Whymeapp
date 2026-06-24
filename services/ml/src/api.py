"""
ML API — Whyme.

FastAPI server exposing endpoints for OCEAN scoring, matching, and embeddings.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, model_validator

from src.scorer import compute_ocean_score, compute_match, DIMENSIONS

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Whyme ML Service",
    version="2.0.0",
    description="OCEAN personality scoring, matching, and BERT-pt embeddings",
)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class ScoreRequest(BaseModel):
    respostas: list[int] = Field(
        ...,
        min_length=30,
        max_length=30,
        description="Lista de 30 respostas (1-5 Likert) do questionário OCEAN",
        example=[4, 5, 2, 4, 5, 3, 5, 4, 2, 5, 4, 1, 4, 2, 3, 2, 3, 2, 5, 2, 4, 3, 4, 3, 2, 4, 3, 3, 2, 3],
    )


class ScoreResponse(BaseModel):
    openness: float
    conscientiousness: float
    extraversion: float
    agreeableness: float
    neuroticism: float


class MatchRequest(BaseModel):
    candidate_ocean: dict[str, float] = Field(
        ...,
        description="Perfil OCEAN do candidato (0-100 cada dimensão)",
        example={
            "openness": 75.0,
            "conscientiousness": 85.0,
            "extraversion": 45.0,
            "agreeableness": 70.0,
            "neuroticism": 30.0,
        },
    )
    company_ideal: dict[str, float] = Field(
        ...,
        description="Perfil OCEAN ideal da empresa (0-100 cada dimensão)",
        example={
            "openness": 80.0,
            "conscientiousness": 90.0,
            "extraversion": 50.0,
            "agreeableness": 75.0,
            "neuroticism": 25.0,
        },
    )


class MatchResponse(BaseModel):
    score: float
    breakdown: dict[str, float]
    euclidean_distance: float
    similarity: float


class EmbedRequest(BaseModel):
    text: str = Field(
        "",
        min_length=0,
        description="Texto para gerar embedding (opcional se answers for fornecido)",
    )
    answers: Optional[dict[str, str]] = Field(
        None,
        description="(Opcional) Dicionário de respostas para gerar vetor de cultura da empresa",
    )

    @model_validator(mode="after")
    def check_text_or_answers(self):
        if not self.text and not self.answers:
            raise ValueError("Either 'text' or 'answers' must be provided")
        return self


class EmbedResponse(BaseModel):
    embedding: list[float]
    dimension: int
    mode: str = "text"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "ml", "version": "2.0.0"}


@app.post("/score", response_model=ScoreResponse, tags=["OCEAN"])
async def score(request: ScoreRequest):
    """Compute OCEAN personality profile from 30 questionnaire responses."""
    try:
        scores = compute_ocean_score(request.respostas)
        return ScoreResponse(**scores)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/match", response_model=MatchResponse, tags=["OCEAN"])
async def match(request: MatchRequest):
    """Compute match score between candidate and company OCEAN profiles."""
    for dim in DIMENSIONS:
        if dim not in request.candidate_ocean:
            raise HTTPException(
                status_code=422,
                detail=f"Missing dimension '{dim}' in candidate_ocean",
            )
        if dim not in request.company_ideal:
            raise HTTPException(
                status_code=422,
                detail=f"Missing dimension '{dim}' in company_ideal",
            )

    result = compute_match(request.candidate_ocean, request.company_ideal)
    return MatchResponse(**result)


@app.post("/embed", response_model=EmbedResponse, tags=["Embeddings"])
async def embed(request: EmbedRequest):
    """Generate BERT-pt embedding for text or company culture vector."""
    # Lazy import to avoid loading model on startup
    from src.embedding_service import get_embedding, get_company_culture_vector

    if request.answers:
        embedding = get_company_culture_vector(request.answers)
        mode = "company_culture"
    else:
        embedding = get_embedding(request.text)
        mode = "text"

    return EmbedResponse(
        embedding=embedding,
        dimension=len(embedding),
        mode=mode,
    )
