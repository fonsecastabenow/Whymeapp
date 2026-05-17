import asyncio
import json
import logging
import os
import secrets
import socket
import urllib.request
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_session
from models.candidate import Candidate
from models.interview_session import InterviewSession
from models.job import Job
from models.match import Match
from models.user import User
from services.matching_service import compute_match_score

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interviews/chat", tags=["interviews"])

DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"


def get_api_key():
    key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not key:
        raise HTTPException(status_code=503, detail="DeepSeek API key not configured")
    return key


GUIDELINES = """You are Whyme, a warm, human OCEAN interview bot for a recruiting platform.

YOUR JOB: Conduct a natural, flowing personality interview. Each candidate is unique — ask questions that adapt to their answers. Never read from a script.

PERSONALITY: Warm, curious, human. NOT robotic. Use natural Portuguese (or match the candidate's language). Be genuinely interested. Vary your tone: sometimes casual, sometimes reflective, sometimes with a light joke.

RULES:
1. Ask ONE question at a time. Never multiple.
2. Vary your QUESTION STRUCTURE every time: scenario, direct, reflective, hypothetical, past-experience. Never repeat the same pattern.
3. After each answer, give a BRIEF natural acknowledgment (1 sentence), then your next question.
4. KEEP RESPONSES SHORT: 2-3 sentences max per turn.
5. NEVER say "as an AI" or break the human illusion.
6. NEVER answer the question for them.
7. If an answer is too short ("sim", "nao"), gently probe: "Pode me contar um pouco mais?"
8. Reference their PREVIOUS ANSWERS naturally to create continuity.

DIMENSIONS TO COVER (cover ALL 5, probing deeper where needed):

--- OPENNESS (curiosidade, adaptabilidade, abertura a risco) ---
High: exploring, learning, trying new things, questioning status quo
Low: routine, comfortable with the known, cautious about change

--- CONSCIENTIOUSNESS (organizacao, persistencia, atencao a detalhes) ---
High: structured, planned, meticulous, meets deadlines, quality-focused
Low: spontaneous, flexible, last-minute, big-picture focused

--- EXTRAVERSION (sociabilidade, energia social, assertividade) ---
High: energized by people, talkative, takes initiative in groups
Low: recharged by solitude, reserved, thoughtful before speaking

--- AGREEABLENESS (cooperacao, empatia, estilo de conflito) ---
High: accommodating, empathetic, seeks harmony, collaborative
Low: direct, confrontational, prioritizes truth over harmony

--- NEUROTICISM (ansiedade, instabilidade emocional, reatividade ao estresse) ---
High: anxious under pressure, affected by criticism, ruminates
Low: calm under pressure, resilient, bounces back quickly

INTERVIEW PROGRESSION:
- Aim for 25-35 total interactions.
- Cover EACH dimension with 2 "top" questions + follow-up probes (4-6 per dimension).
- Do NOT ask in fixed order. Mix them naturally.
- END when each dimension has 3+ quality answers and you feel confident."""


def _force_ipv4():
    _orig = socket.getaddrinfo
    def _ipv4(host, port, family=0, type=0, proto=0, flags=0):
        return _orig(host, port, socket.AF_INET, type, proto, flags)
    socket.getaddrinfo = _ipv4


def call_deepseek(messages, temp=0.75, max_tok=400):
    _force_ipv4()
    api_key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not api_key:
        return None
    body = json.dumps({
        "model": "deepseek-chat",
        "messages": messages,
        "temperature": temp,
        "max_tokens": max_tok,
    }).encode()
    try:
        req = urllib.request.Request(
            DEEPSEEK_API_URL, data=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
        )
        data = json.loads(urllib.request.urlopen(req, timeout=30).read())
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error("DeepSeek call failed: %s", e)
        return None


def generate_first_question():
    messages = [
        {"role": "system", "content": GUIDELINES},
        {"role": "user", "content": (
            "The interview is starting. This is the FIRST question. "
            "Open warmly, introduce yourself briefly, and ask the very first question. "
            "Start exploring OPENNESS — use a natural scenario or past-experience question. "
            "Make it feel like a conversation start, not a test. Be warm."
        )},
    ]
    reply = call_deepseek(messages, temp=0.85, max_tok=200)
    return reply or (
        "Ola! Vou te fazer algumas perguntas sobre seu jeito de trabalhar. "
        "Para comecar: como voce reage quando precisa aprender algo completamente novo?"
    )


def generate_next_question(transcript, total_answers, last_answer):
    conv = [{"role": "system", "content": GUIDELINES}]
    for qa in transcript:
        if qa.get("question"):
            conv.append({"role": "assistant", "content": qa["question"]})
        conv.append({"role": "user", "content": qa["answer"]})
    conv.append({"role": "user", "content": (
        f"The interview is in progress. So far {total_answers} answers collected. "
        f"The candidate just answered: '{last_answer}'. "
        "Acknowledge their answer briefly (1 sentence), then ask the NEXT question. "
        "Consider: which dimension still needs data? Vary your question structure. "
        "Be natural and warm. Generate ONLY your response — no JSON, no notes."
    )})
    return call_deepseek(conv, temp=0.85, max_tok=250)


def check_completion(transcript, total_answers):
    conv = [{"role": "system", "content": GUIDELINES}]
    for qa in transcript:
        if qa.get("question"):
            conv.append({"role": "assistant", "content": qa["question"]})
        conv.append({"role": "user", "content": qa["answer"]})
    conv.append({"role": "user", "content": (
        f"You've collected {total_answers} answers total. "
        "Do you have ENOUGH data to generate a confident OCEAN profile? "
        "Reply ONLY with one word: 'DONE' if ready, or 'MORE' if you need more questions."
    )})
    check = call_deepseek(conv, temp=0.2, max_tok=10)
    return bool(check and check.strip().upper() == "DONE")


def finalize_scores(transcript):
    history_str = "\n\n".join(
        f"[{i+1}] R: {qa['answer']}" for i, qa in enumerate(transcript)
    )
    prompt = f"""Analyze this full interview transcript and generate OCEAN scores with sub-criteria.

{history_str}

For EACH dimension, score 3 sub-criteria (0.0 to 1.0, precise values like 0.63).
Then compute 'final' as the average of sub-criteria.

DIMENSIONS AND SUB-CRITERIA:
- openness: curiosidade_intelectual, adaptabilidade, abertura_a_risco
- conscientiousness: organizacao, persistencia, atencao_detalhes
- extraversion: sociabilidade, energia_social, assertividade
- agreeableness: cooperacao, empatia, estilo_conflito
- neuroticism: ansiedade, instabilidade_emocional, reatividade_estresse

Return ONLY valid JSON:
{{"openness": {{"curiosidade_intelectual": 0.0, "adaptabilidade": 0.0, "abertura_a_risco": 0.0, "final": 0.0}},
  "conscientiousness": {{"organizacao": 0.0, "persistencia": 0.0, "atencao_detalhes": 0.0, "final": 0.0}},
  "extraversion": {{"sociabilidade": 0.0, "energia_social": 0.0, "assertividade": 0.0, "final": 0.0}},
  "agreeableness": {{"cooperacao": 0.0, "empatia": 0.0, "estilo_conflito": 0.0, "final": 0.0}},
  "neuroticism": {{"ansiedade": 0.0, "instabilidade_emocional": 0.0, "reatividade_estresse": 0.0, "final": 0.0}}}}

NEVER round 'final' to a multiple of 5 or 10. Use natural averages like 0.63 or 0.78."""

    try:
        result = call_deepseek([
            {"role": "system", "content": "You are an OCEAN personality analysis expert. Return ONLY valid JSON. Never round scores."},
            {"role": "user", "content": prompt},
        ], temp=0.3, max_tok=600)
        if result:
            result = result.strip()
            if "```json" in result:
                result = result.split("```json")[1].split("```")[0].strip()
            elif "```" in result:
                result = result.split("```")[1].split("```")[0].strip()
            scores = json.loads(result)
            for dim in ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]:
                if dim in scores and isinstance(scores[dim], dict):
                    for k in scores[dim]:
                        if isinstance(scores[dim][k], (int, float)):
                            scores[dim][k] = max(0.05, min(0.95, float(scores[dim][k])))
            return scores
    except Exception as e:
        logger.error("Score error: %s", e)
    return None


# ─── Pydantic models ──────────────────────────────────────────────────────────

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
    total: int = 30


class ChatScoreResponse(BaseModel):
    ocean_scores: dict


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/start", response_model=ChatStartResponse)
async def chat_start(
    body: ChatStartRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    get_api_key()  # fail fast if key missing

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

    first_q = await asyncio.to_thread(generate_first_question)

    return ChatStartResponse(token=token, question=first_q, question_number=1, total=30)


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

    answers = list(interview.answers or [])
    current_q = interview.current_question or 0

    answers.append({"question_id": current_q, "answer": body.answer.strip()})
    interview.answers = answers

    total_answers = len(answers)
    transcript = [{"answer": a["answer"]} for a in answers]

    # After 20+ answers, let DeepSeek decide if we have enough data
    if total_answers >= 20:
        is_done = await asyncio.to_thread(check_completion, transcript, total_answers)
        if is_done:
            interview.status = "completed"
            interview.current_question = total_answers
            await session.commit()
            return ChatQuestionResponse(completed=True, total=30)

    interview.current_question = total_answers
    await session.commit()

    next_reply = await asyncio.to_thread(
        generate_next_question, transcript, total_answers, body.answer.strip()
    )
    if not next_reply:
        fallbacks = [
            "Me conta mais sobre como voce lida com mudancas no trabalho.",
            "E como voce organiza suas prioridades no dia a dia?",
            "Como e sua interacao com o time no dia a dia?",
            "E quando precisa dar um feedback dificil para alguem?",
            "Como voce lida com situacoes de alta pressao?",
        ]
        next_reply = fallbacks[total_answers % len(fallbacks)]

    return ChatQuestionResponse(
        completed=False,
        question=next_reply,
        question_number=total_answers + 1,
        total=30,
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

    transcript = [{"answer": a["answer"]} for a in answers]
    ocean_scores = await asyncio.to_thread(finalize_scores, transcript)
    if not ocean_scores:
        raise HTTPException(status_code=502, detail="Erro ao analisar perfil OCEAN")

    dims = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]
    flat_scores = {
        dim: round(ocean_scores.get(dim, {}).get("final", 0.5) * 100)
        for dim in dims
    }

    cand_result = await session.execute(
        select(Candidate).where(Candidate.id == interview.candidate_id)
    )
    candidate = cand_result.scalar_one_or_none()
    if candidate:
        candidate.ocean_scores = flat_scores

    interview.status = "ocean_completed"
    await session.commit()

    # Auto-trigger matching for this candidate
    try:
        jobs_result = await session.execute(
            select(Job).where(Job.status == "active", Job.ocean_ideal.isnot(None))
        )
        jobs = jobs_result.scalars().all()
        created_matches = 0
        for job in jobs:
            score, breakdown = await compute_match_score(flat_scores, job.ocean_ideal)
            if score < 0.6:
                continue
            existing = await session.execute(
                select(Match).where(
                    Match.job_id == job.id,
                    Match.candidate_id == interview.candidate_id,
                )
            )
            if existing.scalar_one_or_none():
                continue
            match = Match(
                job_id=job.id,
                candidate_id=interview.candidate_id,
                score=score,
                ocean_breakdown=breakdown,
                status="pending",
            )
            session.add(match)
            created_matches += 1
        interview.status = "matched"
        await session.commit()
        logger.info("Chat matching: %d matches for %s", created_matches, interview.candidate_id)
    except Exception as e:
        logger.error("Matching error after chat interview: %s", e)

    return ChatScoreResponse(ocean_scores=flat_scores)
