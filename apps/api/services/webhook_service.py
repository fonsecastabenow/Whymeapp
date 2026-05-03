import hashlib
import hmac
import uuid
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.webhook import Webhook


def _compute_signature(body: bytes, secret: str) -> str:
    """Compute HMAC-SHA256 signature for the given body and secret."""
    return hmac.new(
        secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()


async def dispatch_webhook(
    session: AsyncSession,
    event_type: str,
    payload: dict,
    company_id: uuid.UUID,
) -> None:
    """Dispatch an event to all active webhooks of the company that subscribe to this event type."""
    result = await session.execute(
        select(Webhook).where(
            Webhook.company_id == company_id,
            Webhook.is_active == True,  # noqa: E712
        )
    )
    webhooks = result.scalars().all()

    delivery_id = uuid.uuid4()
    created_at = datetime.now(timezone.utc)
    body_data = {
        "event": event_type,
        "created_at": created_at.isoformat(),
        "data": payload,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        for webhook in webhooks:
            if event_type not in webhook.events:
                continue

            body_bytes = (
                __import__("json").dumps(body_data, default=str).encode("utf-8")
            )
            signature = _compute_signature(body_bytes, webhook.secret)

            headers = {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signature,
                "X-Webhook-Event": event_type,
                "X-Webhook-Delivery": str(delivery_id),
            }

            try:
                response = await client.post(webhook.url, content=body_bytes, headers=headers)
                print(
                    f"[Webhook] {event_type} -> {webhook.url} "
                    f"({response.status_code}) delivery={delivery_id}"
                )
            except Exception as exc:
                print(
                    f"[Webhook] FAILED {event_type} -> {webhook.url} "
                    f"delivery={delivery_id}: {exc}"
                )
