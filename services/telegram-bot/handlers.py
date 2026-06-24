import logging

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes, ConversationHandler

from api_client import (
    create_anonymous_candidate,
    create_interview,
    save_ocean_scores,
    update_interview_status,
)
from ocean_quiz import LIKERT_OPTIONS, QUESTIONS, calculate_scores, format_results_html

logger = logging.getLogger(__name__)

QUIZ_IN_PROGRESS = 1

_LIKERT_KEYBOARD = InlineKeyboardMarkup([
    [InlineKeyboardButton(f"{val} — {label}", callback_data=f"answer_{val}")]
    for val, label in LIKERT_OPTIONS
])


def _question_html(num: int) -> str:
    q = QUESTIONS[num]
    total = len(QUESTIONS)
    pct = (num + 1) / total * 100
    filled = round(pct / 100 * 20)
    bar = "▓" * filled + "░" * (20 - filled)
    return (
        f"<b>Pergunta {num + 1}/{total}</b>\n"
        f"<code>{bar}</code> {pct:.0f}%\n\n"
        f"<i>Eu me vejo como alguém que...</i>\n\n"
        f"{q['text']}"
    )


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user

    if context.user_data.get("current_question") is not None:
        await update.message.reply_text(
            "Você tem um questionário em andamento. Use /cancel para cancelar ou continue respondendo."
        )
        return

    try:
        candidate = await create_anonymous_candidate()
        context.user_data["candidate_id"] = candidate["candidate_id"]
        context.user_data["token"] = candidate["token"]
        context.user_data["interview_link"] = candidate["interview_link"]
    except Exception:
        logger.exception("Error creating anonymous candidate for user %s", user.id)
        await update.message.reply_text(
            "Erro ao criar sua sessão. Por favor, tente novamente em instantes."
        )
        return

    await update.message.reply_html(
        f"Olá, <b>{user.first_name}</b>! 👋\n\n"
        "Bem-vindo ao <b>Whyme</b> — plataforma de matching por perfil de personalidade.\n\n"
        "Responderei <b>30 perguntas</b> para mapear seu perfil OCEAN (Big Five).\n"
        "Responda com honestidade — não há respostas certas ou erradas!\n\n"
        "Digite /quiz para iniciar o questionário.\n"
        "Digite /help para ver todos os comandos."
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_html(
        "<b>Comandos disponíveis:</b>\n\n"
        "/start — Criar uma nova sessão anônima\n"
        "/quiz — Iniciar o questionário OCEAN (30 perguntas)\n"
        "/cancel — Cancelar o questionário em andamento\n"
        "/health — Verificar status do bot\n"
        "/help — Mostrar esta mensagem"
    )


async def health_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("Bot online e funcionando!")


async def quiz_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    if "candidate_id" not in context.user_data:
        try:
            candidate = await create_anonymous_candidate()
            context.user_data["candidate_id"] = candidate["candidate_id"]
            context.user_data["token"] = candidate["token"]
        except Exception:
            logger.exception("Error auto-creating candidate in /quiz for user %s", update.effective_user.id)
            await update.message.reply_text(
                "Erro ao criar sua sessão. Por favor, tente /start e depois /quiz novamente."
            )
            return ConversationHandler.END

    candidate_id = context.user_data["candidate_id"]

    try:
        interview = await create_interview(candidate_id)
        await update_interview_status(interview["id"], "started")
        context.user_data["interview_id"] = interview["id"]
    except Exception:
        logger.exception("Error creating interview for candidate %s", candidate_id)
        await update.message.reply_text(
            "Erro ao iniciar a entrevista. Por favor, tente novamente."
        )
        return ConversationHandler.END

    context.user_data["current_question"] = 0
    context.user_data["answers"] = []

    await update.message.reply_html(
        "🚀 <b>Questionário OCEAN iniciado!</b>\n\n"
        "Use os botões abaixo para responder cada pergunta.\n"
        "Digite /cancel a qualquer momento para cancelar.\n\n"
        "<i>Vamos lá!</i>"
    )
    await update.message.reply_html(
        _question_html(0),
        reply_markup=_LIKERT_KEYBOARD,
    )
    return QUIZ_IN_PROGRESS


async def handle_answer(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    answer_val = int(query.data.split("_")[1])
    context.user_data["answers"].append(answer_val)

    next_q = context.user_data["current_question"] + 1
    context.user_data["current_question"] = next_q

    if next_q >= len(QUESTIONS):
        return await _finish_quiz(query, context)

    await query.edit_message_text(
        _question_html(next_q),
        parse_mode=ParseMode.HTML,
        reply_markup=_LIKERT_KEYBOARD,
    )
    return QUIZ_IN_PROGRESS


async def _finish_quiz(query, context: ContextTypes.DEFAULT_TYPE) -> int:
    interview_id = context.user_data["interview_id"]
    answers = context.user_data["answers"]

    await query.edit_message_text("⏳ Calculando seu perfil OCEAN...")

    scores = calculate_scores(answers)

    try:
        await update_interview_status(interview_id, "ocean_pending")
        await update_interview_status(interview_id, "ocean_completed")
        await save_ocean_scores(interview_id, scores)
    except Exception:
        logger.exception("Error saving scores for interview %s", interview_id)
        await query.edit_message_text(
            "Erro ao salvar seus resultados. Por favor, tente novamente com /quiz."
        )
        return ConversationHandler.END

    await query.edit_message_text(format_results_html(scores), parse_mode=ParseMode.HTML)

    for key in ("interview_id", "current_question", "answers"):
        context.user_data.pop(key, None)

    return ConversationHandler.END


async def cancel_quiz(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    for key in ("interview_id", "current_question", "answers"):
        context.user_data.pop(key, None)
    await update.message.reply_text(
        "Questionário cancelado. Digite /quiz para recomeçar quando quiser."
    )
    return ConversationHandler.END
