import os

from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN: str = os.environ["TELEGRAM_BOT_TOKEN"]
API_BASE_URL: str = os.getenv("API_BASE_URL", "http://api:8000")
