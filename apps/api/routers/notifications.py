import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class NotificationOut(BaseModel):
    id: str
    user_id: str
    match_id: Optional[str]
    type: str
    title: str
    message: Optional[str]
    is_read: bool
    created_at: str


class ReadAllRequest(BaseModel):
    user_id: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _notif_to_out(n: Notification) -> NotificationOut:
    return NotificationOut(
        id=str(n.id),
        user_id=str(n.user_id),
        match_id=str(n.match_id) if n.match_id else None,
        type=n.type,
        title=n.title,
        message=n.message,
        is_read=n.is_read,
        created_at=n.created_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/user/{user_id}", response_model=list[NotificationOut])
async def list_user_notifications(
    user_id: str,
    session: AsyncSession = Depends(get_session),
):
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid user_id format",
        )

    result = await session.execute(
        select(Notification)
        .where(Notification.user_id == user_uuid)
        .order_by(Notification.created_at.desc())
    )
    notifications = result.scalars().all()
    return [_notif_to_out(n) for n in notifications]


@router.patch("/{id}/read", response_model=NotificationOut)
async def mark_notification_read(
    id: str,
    session: AsyncSession = Depends(get_session),
):
    try:
        notif_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid notification id format",
        )

    result = await session.execute(select(Notification).where(Notification.id == notif_uuid))
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.is_read = True
    await session.flush()
    await session.refresh(notification)
    return _notif_to_out(notification)


@router.post("/read-all")
async def mark_all_read(
    request: ReadAllRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        user_uuid = uuid.UUID(request.user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid user_id format",
        )

    result = await session.execute(
        select(Notification).where(
            Notification.user_id == user_uuid,
            Notification.is_read == False,  # noqa: E712
        )
    )
    notifications = result.scalars().all()
    for n in notifications:
        n.is_read = True
    await session.flush()
    return {"updated": len(notifications)}
