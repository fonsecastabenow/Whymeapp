import logging

from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ConversationHandler,
)

from config import TELEGRAM_BOT_TOKEN
from handlers import (
    QUIZ_IN_PROGRESS,
    cancel_quiz,
    handle_answer,
    health_command,
    help_command,
    quiz_start,
    start_command,
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def main() -> None:
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("health", health_command))

    quiz_conv = ConversationHandler(
        entry_points=[CommandHandler("quiz", quiz_start)],
        states={
            QUIZ_IN_PROGRESS: [
                CallbackQueryHandler(handle_answer, pattern=r"^answer_[1-5]$"),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel_quiz)],
        per_user=True,
        per_chat=True,
    )
    application.add_handler(quiz_conv)

    logger.info("Starting Whyme Telegram bot (polling mode)...")
    application.run_polling(allowed_updates=["message", "callback_query"])


if __name__ == "__main__":
    main()
