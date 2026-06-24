import asyncio
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.candidate import Candidate
from models.company import Company
from models.job import Job
from models.notification import Notification
from models.user import User
from services.email_service import send_email
from services.template_service import render_template
from services.webhook_service import dispatch_webhook

logger = logging.getLogger(__name__)

_EMAIL_TEMPLATES: dict[str, tuple[str, str]] = {
    "match_candidate": ("match_candidate.html", "Você tem um novo match no Whyme!"),
    "match_company": ("match_company.html", "Novo match para sua vaga no Whyme!"),
}


async def send_email_notification(
    session: AsyncSession,
    notification: Notification,
    context: dict,
) -> None:
    result = await session.execute(select(User).where(User.id == notification.user_id))
    user = result.scalar_one_or_none()
    if not user:
        logger.warning("User %s not found — skipping email notification", notification.user_id)
        return

    template_info = _EMAIL_TEMPLATES.get(notification.type)
    if not template_info:
        logger.debug("No email template for notification type %r", notification.type)
        return

    template_name, subject = template_info
    try:
        html = render_template(template_name, context)
    except Exception as exc:
        logger.error("Failed to render email template %r: %s", template_name, exc)
        return

    success = await asyncio.to_thread(send_email, user.email, subject, html)
    if success:
        logger.info(
            "Email notification sent to %s for notification %s (type=%s)",
            user.email, notification.id, notification.type,
        )
    else:
        logger.warning(
            "Email notification failed for %s notification %s",
            user.email, notification.id,
        )


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

    # Send email notifications (failures are logged, never raised)
    email_context = {
        "job_title": job.title,
        "company_name": company.name,
        "candidate_name": candidate.name,
        "candidate_id": str(candidate.id),
        "company_id": str(company.id),
        "subject": "",
    }
    await send_email_notification(session, notif_candidate, email_context)
    await send_email_notification(session, notif_company, email_context)

    return [notif_candidate, notif_company]
