import json
import os
import secrets
import uuid

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_session
from models.candidate import Candidate
from models.interview_session import InterviewSession
from models.user import User
from routers.interviews_telegram import TELEGRAM_INTERVIEW_QUESTIONS

router = APIRouter(prefix="/interviews/chat", tags=["interviews"])

TOTAL_QUESTIONS = len(TELEGRAM_INTERVIEW_QUESTIONS)


# ─── Request / Response models ────────────────────────────────────────────────

class ChatStartRequest(BaseModel):
    candidate_id: str


class ChatStartResponse(BaseModel):
    token: str
    question: str
    question_number: int
    total: int


class ChatAnswerRequest(BaseModel):
    answer: str


class ChatQuestionResponse(BaseModel):
    completed: bool
    question: str | None = None
    question_number: int | None = None
    total: int = TOTAL_QUESTIONS


class ChatScoreResponse(BaseModel):
    ocean_scores: dict


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/start", response_model=ChatStartResponse)
async def chat_start(
    body: ChatStartRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    try:
        candidate_uuid = uuid.UUID(body.candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid candidate_id")

    result = await session.execute(
        select(Candidate).where(Candidate.id == candidate_uuid)
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidato não encontrado")

    token = secrets.token_hex(16)
    interview_session = InterviewSession(
        candidate_id=candidate_uuid,
        token=token,
        status="in_progress",
        current_question=0,
        answers=[],
    )
    session.add(interview_session)
    await session.commit()
    await session.refresh(interview_session)

    first_q = TELEGRAM_INTERVIEW_QUESTIONS[0]
    return ChatStartResponse(
        token=token,
        question=first_q["question"],
        question_number=1,
        total=TOTAL_QUESTIONS,
    )


@router.post("/{token}/answer", response_model=ChatQuestionResponse)
async def chat_answer(
    token: str,
    body: ChatAnswerRequest,
    session: AsyncSession = Depends(get_session),
):
    if not body.answer.strip():
        raise HTTPException(status_code=422, detail="A resposta não pode ser vazia")

    result = await session.execute(
        select(InterviewSession).where(InterviewSession.token == token)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    if interview.status == "completed":
        raise HTTPException(status_code=409, detail="Entrevista já concluída")

    current_q = interview.current_question or 0
    q_data = TELEGRAM_INTERVIEW_QUESTIONS[current_q]

    answers = list(interview.answers or [])
    answers.append({
        "question_id": current_q,
        "dimension": q_data["dimension"],
        "question": q_data["question"],
        "answer": body.answer.strip(),
    })
    interview.answers = answers

    next_q = current_q + 1
    if next_q >= TOTAL_QUESTIONS:
        interview.status = "completed"
        interview.current_question = next_q
        await session.commit()
        return ChatQuestionResponse(completed=True)

    interview.current_question = next_q
    await session.commit()

    next_q_data = TELEGRAM_INTERVIEW_QUESTIONS[next_q]
    return ChatQuestionResponse(
        completed=False,
        question=next_q_data["question"],
        question_number=next_q + 1,
        total=TOTAL_QUESTIONS,
    )


@router.post("/{token}/score", response_model=ChatScoreResponse)
async def chat_score(
    token: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(InterviewSession).where(InterviewSession.token == token)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    if interview.status != "completed":
        raise HTTPException(status_code=422, detail="A entrevista ainda não foi concluída")

    answers = interview.answers or []
    if not answers:
        raise HTTPException(status_code=422, detail="Nenhuma resposta registrada")

    ocean_scores = await _compute_ocean_scores(answers)

    cand_result = await session.execute(
        select(Candidate).where(Candidate.id == interview.candidate_id)
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidato não encontrado")

    candidate.ocean_scores = ocean_scores
    interview.status = "ocean_completed"
    await session.commit()

    return ChatScoreResponse(ocean_scores=ocean_scores)


# ─── LLM scoring ─────────────────────────────────────────────────────────────

async def _compute_ocean_scores(answers: list[dict]) -> dict:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Serviço de análise não configurado. Contate o suporte.",
        )

    formatted_qa = "\n\n".join(
        f"Pergunta {i + 1} (dimensão: {a.get('dimension', '?')}):\n{a['question']}\nResposta: {a['answer']}"
        for i, a in enumerate(answers)
    )

    prompt = f"""Você é um psicólogo especialista no modelo Big Five (OCEAN).
Analise as seguintes respostas de uma entrevista de emprego e pontue cada dimensão OCEAN de 0 a 100.

{formatted_qa}

Instruções de pontuação:
- openness: curiosidade intelectual, criatividade, abertura a novas experiências
- conscientiousness: organização, disciplina, orientação a objetivos
- extraversion: sociabilidade, assertividade, energia social
- agreeableness: empatia, cooperação, receptividade à crítica
- neuroticism: ansiedade, reatividade emocional, estresse (maior = mais instável emocionalmente)

Retorne APENAS um JSON válido, sem texto adicional, markdown ou explicações:
{{"openness": X, "conscientiousness": X, "extraversion": X, "agreeableness": X, "neuroticism": X}}"""

    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=128,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code blocks if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        scores = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Erro ao interpretar análise OCEAN: {exc}",
        ) from exc

    required = {"openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"}
    if not required.issubset(scores.keys()):
        raise HTTPException(status_code=502, detail="Resposta de análise incompleta")

    return {k: max(0.0, min(100.0, float(scores[k]))) for k in required}
