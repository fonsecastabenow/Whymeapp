"""
Demo seed: Hermes Talent Solutions company + job posting + company user.
Idempotent — safe to run multiple times.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import hash_password
from database import async_session_factory, engine
from models.user import User
from models.company import Company
from models.job import Job

COMPANY_NAME = "Hermes Talent Solutions"
USER_EMAIL = "hermes@hermestalent.test"
USER_PASSWORD = "HermesAgent.97"
USER_NAME = "Hermes Talent Solutions"
JOB_TITLE = "Senior AI Agent Engineer"

OCEAN_IDEAL = {
    "openness": 0.85,
    "conscientiousness": 0.80,
    "extraversion": 0.55,
    "agreeableness": 0.75,
    "neuroticism": 0.30,
}

JOB_DESCRIPTION = (
    "We are looking for a Senior AI Agent Engineer to design, build, and deploy "
    "autonomous AI agents. You will work at the intersection of LLMs, tool use, "
    "and agentic orchestration frameworks to create reliable, production-grade agents."
)

JOB_REQUIREMENTS = (
    "- 3+ years experience with LLMs and AI systems\n"
    "- Strong background in Python and async programming\n"
    "- Experience with agentic frameworks (LangChain, CrewAI, or similar)\n"
    "- Familiarity with RAG pipelines and vector databases\n"
    "- Excellent written communication and documentation habits"
)


async def seed() -> None:
    async with async_session_factory() as session:
        # --- User ---
        result = await session.execute(select(User).where(User.email == USER_EMAIL))
        user = result.scalar_one_or_none()

        if user:
            print(f"[skip] User already exists: {user.email} (id={user.id})")
        else:
            user = User(
                email=USER_EMAIL,
                password_hash=hash_password(USER_PASSWORD),
                name=USER_NAME,
                role="company",
            )
            session.add(user)
            await session.flush()
            await session.refresh(user)
            print(f"[created] User: {user.email} (id={user.id})")

        # --- Company ---
        result = await session.execute(
            select(Company).where(Company.user_id == user.id)
        )
        company = result.scalar_one_or_none()

        if company:
            print(f"[skip] Company already exists: {company.name} (id={company.id})")
        else:
            company = Company(
                id=user.id,
                user_id=user.id,
                name=COMPANY_NAME,
                description="Boutique talent solutions firm specialising in AI and tech placements.",
                industry="Human Resources & Recruiting",
            )
            session.add(company)
            await session.flush()
            await session.refresh(company)
            print(f"[created] Company: {company.name} (id={company.id})")

        # --- Job ---
        result = await session.execute(
            select(Job).where(
                Job.company_id == company.id,
                Job.title == JOB_TITLE,
            )
        )
        job = result.scalar_one_or_none()

        if job:
            print(f"[skip] Job already exists: {job.title} (id={job.id})")
        else:
            job = Job(
                company_id=company.id,
                title=JOB_TITLE,
                description=JOB_DESCRIPTION,
                requirements=JOB_REQUIREMENTS,
                ocean_ideal=OCEAN_IDEAL,
                status="open",
                work_model="remote",
            )
            session.add(job)
            await session.flush()
            await session.refresh(job)
            print(f"[created] Job: {job.title} (id={job.id})")

        await session.commit()
        print("\nSeed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
