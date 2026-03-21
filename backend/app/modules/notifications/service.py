"""
AEOS – Notification service.

Provides create_notification() helper and query functions.
"""

from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Notification

logger = logging.getLogger("aeos.notifications")


async def create_notification(
    db: AsyncSession,
    workspace_id: str,
    title: str,
    message: str,
    type: str = "info",
    link: Optional[str] = None,
    user_id: Optional[str] = None,
) -> Notification:
    """Create a new notification for a workspace (and optionally a specific user)."""
    notif = Notification(
        workspace_id=workspace_id,
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        link=link,
    )
    db.add(notif)
    await db.flush()
    logger.info("Notification created: workspace=%s title=%s", workspace_id, title)
    return notif


async def get_notifications(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
    limit: int = 20,
    offset: int = 0,
) -> list[Notification]:
    """Get notifications for a user in a workspace (newest first).
    Returns workspace-wide (user_id IS NULL) and user-specific notifications.
    """
    q = (
        select(Notification)
        .where(
            Notification.workspace_id == workspace_id,
            (Notification.user_id == user_id) | (Notification.user_id.is_(None)),
        )
        .order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_unread_count(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
) -> int:
    """Count unread notifications for a user in a workspace."""
    q = select(func.count(Notification.id)).where(
        Notification.workspace_id == workspace_id,
        (Notification.user_id == user_id) | (Notification.user_id.is_(None)),
        Notification.read == False,
    )
    result = await db.execute(q)
    return result.scalar_one()


async def mark_as_read(
    db: AsyncSession,
    notification_id: str,
    workspace_id: str,
) -> bool:
    """Mark a single notification as read. Returns True if found."""
    q = (
        update(Notification)
        .where(
            Notification.id == notification_id,
            Notification.workspace_id == workspace_id,
        )
        .values(read=True)
    )
    result = await db.execute(q)
    return result.rowcount > 0
