import json
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_session
from models.candidate import Candidate
from models.interview_session import InterviewSession
from models.user import User

router = APIRouter(prefix="/interviews/telegram", tags=["interviews"])

BOT_USERNAME = "Whyme_interview_bot"

TELEGRAM_INTERVIEW_QUESTIONS = [
    {
        "id": 1,
        "question": "Como você lida com prazos apertados e situações de pressão no trabalho? Dá um exemplo real.",
        "dimension": "conscientiousness",
        "hint": "Buscar: planejamento, organização, resiliência"
    },
    {
        "id": 2,
        "question": "Você prefere trabalhar em equipe ou de forma independente? Por quê?",
        "dimension": "extraversion",
        "hint": "Buscar: preferência por colaboração vs autonomia"
    },
    {
        "id": 3,
        "question": "Me conta sobre uma vez que você aprendeu algo novo por conta própria, fora do trabalho ou faculdade.",
        "dimension": "openness",
        "hint": "Buscar: curiosidade, iniciativa, aprendizado autodidata"
    },
    {
        "id": 4,
        "question": "Como você reage quando um colega discorda de você ou critica seu trabalho?",
        "dimension": "agreeableness",
        "hint": "Buscar: receptividade, empatia, conflito construtivo"
    },
    {
        "id": 5,
        "question": "Com que frequência você leva trabalho pra casa ou pensa em problemas do trabalho fora do expediente?",
        "dimension": "neuroticism",
        "hint": "Buscar: ansiedade, desligamento, estresse"
    },
    {
        "id": 6,
        "question": "Você segue processos e regras à risca ou gosta de encontrar seus próprios atalhos?",
        "dimension": "conscientiousness",
        "hint": "Buscar: disciplina, adaptabilidade, estrutura"
    },
    {
        "id": 7,
        "question": "Em uma festa ou evento social, você é a pessoa que puxa conversa ou fica mais na sua?",
        "dimension": "extraversion",
        "hint": "Buscar: sociabilidade, energia social"
    },
    {
        "id": 8,
        "question": "O que te motiva a buscar uma oportunidade nova? Salário, desafio, propósito, ambiente?",
        "dimension": "openness",
        "hint": "Buscar: motivações intrínsecas vs extrínsecas, abertura"
    },
]


class TelegramStartRequest(BaseModel):
    candidate_id: str


class TelegramStartResponse(BaseModel):
    session_id: str
    token: str
    telegram_link: str
    questions_count: int


class TelegramSaveRequest(BaseModel):
    token: str
    ocean_scores: dict
    telegram_chat_id: str | None = None


class TelegramSessionResponse(BaseModel):
    status: str
    current_question: int
    total_questions: int
    question: str | None = None


@router.post("/start", response_model=TelegramStartResponse)
async def telegram_start(
    body: TelegramStartRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Creates an interview session and returns a Telegram deep link."""
    try:
        candidate_uuid = uuid.UUID(body.candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid candidate_id")

    result = await session.execute(
        select(Candidate).where(Candidate.id == candidate_uuid)
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    token = secrets.token_hex(16)
    interview_session = InterviewSession(
        candidate_id=candidate_uuid,
        token=token,
        status="pending",
        current_question=0,
        answers=[],
    )
    session.add(interview_session)
    await session.commit()
    await session.refresh(interview_session)

    telegram_link = f"https://t.me/{BOT_USERNAME}?start={token}"

    return TelegramStartResponse(
        session_id=str(interview_session.id),
        token=token,
        telegram_link=telegram_link,
        questions_count=len(TELEGRAM_INTERVIEW_QUESTIONS),
    )


@router.get("/session/{token}", response_model=TelegramSessionResponse)
async def get_session_status(
    token: str,
    db_session: AsyncSession = Depends(get_session),
):
    """Get the current status of an interview session (used by the bot)."""
    result = await db_session.execute(
        select(InterviewSession).where(InterviewSession.token == token)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Session not found")

    current_q = interview.current_question or 0
    question_text = None
    if 0 <= current_q < len(TELEGRAM_INTERVIEW_QUESTIONS):
        # current_question here is the index of the next question to ask
        question_text = TELEGRAM_INTERVIEW_QUESTIONS[current_q]["question"]

    return TelegramSessionResponse(
        status=interview.status,
        current_question=current_q,
        total_questions=len(TELEGRAM_INTERVIEW_QUESTIONS),
        question=question_text,
    )


@router.post("/save")
async def telegram_save(
    body: TelegramSaveRequest,
    db_session: AsyncSession = Depends(get_session),
):
    """Save the OCEAN profile from a completed Telegram interview."""
    result = await db_session.execute(
        select(InterviewSession).where(InterviewSession.token == body.token)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Session not found")

    if interview.status != "completed":
        raise HTTPException(
            status_code=422,
            detail=f"Session status is '{interview.status}', expected 'completed'",
        )

    # Update with chat info
    if body.telegram_chat_id:
        interview.telegram_chat_id = body.telegram_chat_id

    await db_session.flush()

    # Save ocean_scores to the candidate
    cand_result = await db_session.execute(
        select(Candidate).where(Candidate.id == interview.candidate_id)
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    candidate.ocean_scores = body.ocean_scores
    interview.status = "ocean_completed"

    await db_session.commit()

    return {
        "success": True,
        "candidate_id": str(candidate.id),
        "ocean_scores": body.ocean_scores,
        "message": "Perfil OCEAN salvo com sucesso!",
    }


@router.post("/{token}/answer")
async def record_answer(
    token: str,
    body: dict,
    db_session: AsyncSession = Depends(get_session),
):
    """Record a single answer and advance to the next question."""
    result = await db_session.execute(
        select(InterviewSession).where(InterviewSession.token == token)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Session not found")

    answer_text = body.get("answer", "")
    if not answer_text.strip():
        raise HTTPException(status_code=422, detail="Answer cannot be empty")

    # Store the answer
    answers = interview.answers or []
    current_q = interview.current_question or 0
    answers.append({
        "question_id": current_q,
        "question": TELEGRAM_INTERVIEW_QUESTIONS[current_q]["question"] if current_q < len(TELEGRAM_INTERVIEW_QUESTIONS) else f"q{current_q}",
        "answer": answer_text.strip(),
    })
    interview.answers = answers

    # Advance to next question
    next_q = current_q + 1
    if next_q >= len(TELEGRAM_INTERVIEW_QUESTIONS):
        interview.status = "completed"
        interview.current_question = next_q
        await db_session.commit()
        return {
            "completed": True,
            "question_index": next_q,
            "total": len(TELEGRAM_INTERVIEW_QUESTIONS),
            "message": "Entrevista concluída!",
        }

    interview.current_question = next_q
    interview.status = "in_progress"
    await db_session.commit()

    next_question = TELEGRAM_INTERVIEW_QUESTIONS[next_q]

    return {
        "completed": False,
        "question_index": next_q,
        "question": next_question["question"],
        "total": len(TELEGRAM_INTERVIEW_QUESTIONS),
    }


class TelegramPublicSaveRequest(BaseModel):
    email: str
    ocean_scores: dict
    answers: list[dict]
    telegram_chat_id: str | None = None


@router.post("/public-save")
async def telegram_public_save(
    body: TelegramPublicSaveRequest,
    db_session: AsyncSession = Depends(get_session),
):
    """Public endpoint to save OCEAN profile by email. No auth required."""

    # 1) Find User by email
    user_result = await db_session.execute(
        select(User).where(User.email == body.email)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2) Find Candidate by user_id
    cand_result = await db_session.execute(
        select(Candidate).where(Candidate.user_id == user.id)
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # 3) Save ocean_scores on the candidate
    candidate.ocean_scores = body.ocean_scores

    await db_session.commit()
    await db_session.refresh(candidate)

    return {
        "success": True,
        "candidate_id": str(candidate.id),
    }
