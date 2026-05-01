"""
Initialize the database: create pgvector extension and all tables.

Usage:
    python init_db.py

Requires DATABASE_URL environment variable to be set.
"""

import asyncio
import logging
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import config, fallback to env var
try:
    from config import settings
    DATABASE_URL = settings.database_url
except ImportError:
    DATABASE_URL = os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://whyme:whyme@localhost:5432/whyme",
    )


async def init_db() -> None:
    """Create pgvector extension and all tables."""
    engine = create_async_engine(DATABASE_URL, echo=True)

    try:
        async with engine.connect() as conn:
            logger.info("Creating pgvector extension...")
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.commit()
            logger.info("pgvector extension created successfully.")

        async with engine.begin() as conn:
            logger.info("Creating all tables...")
            await conn.run_sync(Base.metadata.create_all)
            logger.info("All tables created successfully.")

        logger.info("Database initialization complete.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_db())
