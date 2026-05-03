import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.candidate import Candidate
from models.company import Company
from models.job import Job
from models.notification import Notification
from services.webhook_service import dispatch_webhook


async def create_match_notifications(
    session: AsyncSession,
    match_id: uuid.UUID,
    job_id: uuid.UUID,
    candidate_id: uuid.UUID,
) -> list[Notification]:
    candidate_result = await session.execute(
        select(Candidate).where(Candidate.id == candidate_id)
    )
    candidate = candidate_result.scalar_one_or_none()

    job_result = await session.execute(
        select(Job).where(Job.id == job_id)
    )
    job = job_result.scalar_one_or_none()

    company_result = await session.execute(
        select(Company).where(Company.id == job.company_id)
    )
    company = company_result.scalar_one_or_none()

    notif_candidate = Notification(
        user_id=candidate.user_id,
        match_id=match_id,
        type="match_candidate",
        title="Match encontrado!",
        message=f'Você combina com a vaga "{job.title}" da {company.name}',
    )
    notif_company = Notification(
        user_id=company.user_id,
        match_id=match_id,
        type="match_company",
        title="Novo match!",
        message=f'{candidate.name} combina com a vaga "{job.title}"',
    )

    session.add(notif_candidate)
    session.add(notif_company)
    await session.flush()
    await session.refresh(notif_candidate)
    await session.refresh(notif_company)

    # Dispatch webhook for new match event
    payload = {
        "match_id": str(match_id),
        "job_id": str(job_id),
        "candidate_id": str(candidate_id),
        "job_title": job.title,
        "candidate_name": candidate.name,
        "company_name": company.name,
        "company_id": str(company.id),
    }
    await dispatch_webhook(session, "match.new", payload, company.id)

    return [notif_candidate, notif_company]
