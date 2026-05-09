import hashlib
import hmac
import os
import subprocess
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, HttpUrl
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_session
from models.webhook import Webhook

router = APIRouter(prefix="/api/v1", tags=["webhooks"])


# ---------------------------------------------------------------------------
# GitHub deploy webhook (auto-deploy on push)
# ---------------------------------------------------------------------------


def verify_github_signature(payload: bytes, signature_header: str | None) -> bool:
    """Verify GitHub HMAC-SHA256 signature."""
    if not signature_header:
        return False
    secret = settings.webhook_github_secret
    if not secret:
        return False
    expected = "sha256=" + hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


@router.post("/webhooks/github-deploy")
async def github_deploy_webhook(request: Request):
    """Receives GitHub push events and triggers a deploy."""
    if request.headers.get("content-type") != "application/json":
        raise HTTPException(status_code=415, detail="Content-Type must be application/json")

    body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")

    if not verify_github_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    event = request.headers.get("X-GitHub-Event", "unknown")

    # Only deploy on push events
    if event != "push":
        return {"status": "ignored", "event": event, "reason": "not a push event"}

    # Run deploy in background (non-blocking)
    subprocess.Popen(
        ["/root/whyme/deploy.sh"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    return {
        "status": "deploying",
        "event": event,
        "message": "Deploy triggered in background",
    }


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class WebhookCreate(BaseModel):
    url: str
    events: list[str]


class WebhookUpdate(BaseModel):
    url: Optional[str] = None
    events: Optional[list[str]] = None


class WebhookOut(BaseModel):
    id: str
    company_id: str
    url: str
    secret: str
    events: list[str]
    is_active: bool
    created_at: str
    updated_at: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _webhook_to_out(w: Webhook) -> WebhookOut:
    return WebhookOut(
        id=str(w.id),
        company_id=str(w.company_id),
        url=w.url,
        secret=w.secret,
        events=w.events if isinstance(w.events, list) else [],
        is_active=w.is_active,
        created_at=w.created_at.isoformat(),
        updated_at=w.updated_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/companies/{company_id}/webhooks", response_model=WebhookOut, status_code=status.HTTP_201_CREATED)
async def create_webhook(
    company_id: str,
    body: WebhookCreate,
    session: AsyncSession = Depends(get_session),
):
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid company_id format",
        )

    webhook = Webhook(
        company_id=company_uuid,
        url=str(body.url),
        events=body.events,
        secret=uuid.uuid4().hex,
    )
    session.add(webhook)
    await session.flush()
    await session.refresh(webhook)
    return _webhook_to_out(webhook)


@router.get("/companies/{company_id}/webhooks", response_model=list[WebhookOut])
async def list_webhooks(
    company_id: str,
    session: AsyncSession = Depends(get_session),
):
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid company_id format",
        )

    result = await session.execute(
        select(Webhook).where(Webhook.company_id == company_uuid).order_by(Webhook.created_at.desc())
    )
    webhooks = result.scalars().all()
    return [_webhook_to_out(w) for w in webhooks]


@router.put("/webhooks/{webhook_id}", response_model=WebhookOut)
async def update_webhook(
    webhook_id: str,
    body: WebhookUpdate,
    session: AsyncSession = Depends(get_session),
):
    try:
        wh_uuid = uuid.UUID(webhook_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid webhook_id format",
        )

    result = await session.execute(select(Webhook).where(Webhook.id == wh_uuid))
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")

    if body.url is not None:
        webhook.url = body.url
    if body.events is not None:
        webhook.events = body.events
    webhook.updated_at = datetime.now(timezone.utc)

    await session.flush()
    await session.refresh(webhook)
    return _webhook_to_out(webhook)


@router.delete("/webhooks/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    webhook_id: str,
    session: AsyncSession = Depends(get_session),
):
    try:
        wh_uuid = uuid.UUID(webhook_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid webhook_id format",
        )

    result = await session.execute(select(Webhook).where(Webhook.id == wh_uuid))
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")

    await session.delete(webhook)
    await session.flush()


@router.patch("/webhooks/{webhook_id}/toggle", response_model=WebhookOut)
async def toggle_webhook(
    webhook_id: str,
    session: AsyncSession = Depends(get_session),
):
    try:
        wh_uuid = uuid.UUID(webhook_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid webhook_id format",
        )

    result = await session.execute(select(Webhook).where(Webhook.id == wh_uuid))
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")

    webhook.is_active = not webhook.is_active
    webhook.updated_at = datetime.now(timezone.utc)

    await session.flush()
    await session.refresh(webhook)
    return _webhook_to_out(webhook)
