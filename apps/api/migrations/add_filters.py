"""
Migration: add education_course_required, education_course_is_flexible,
hard_skills_min_match, postal_code, acceptance_radius_km to jobs;
add postal_code to candidates.

Run via CLI:  python -c "from migrations.add_filters import run; run()"
Or inline:   python migrations/add_filters.py
"""

import asyncio
import logging

from database import async_session_factory
from sqlalchemy import text

logger = logging.getLogger(__name__)

JOBS_SQL = [
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS education_course_required VARCHAR(255)",
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS education_course_is_flexible BOOLEAN DEFAULT TRUE",
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hard_skills_min_match INTEGER",
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20)",
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS acceptance_radius_km FLOAT",
]

CANDIDATES_SQL = [
    "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20)",
]


async def run():
    async with async_session_factory() as session:
        for stmt in JOBS_SQL:
            try:
                await session.execute(text(stmt))
                logger.info("jobs: %s", stmt.split("ADD")[-1].strip())
            except Exception as exc:
                logger.warning("jobs (ignored): %s – %s", stmt, exc)

        for stmt in CANDIDATES_SQL:
            try:
                await session.execute(text(stmt))
                logger.info("candidates: %s", stmt.split("ADD")[-1].strip())
            except Exception as exc:
                logger.warning("candidates (ignored): %s – %s", stmt, exc)

        await session.commit()
        logger.info("Migration concluída ✅")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    asyncio.run(run())
