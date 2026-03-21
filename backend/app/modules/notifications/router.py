"""
AEOS – Notifications API Router.

GET  /api/v1/notifications         -> list notifications (newest first)
GET  /api/v1/notifications/count   -> unread count
PUT  /api/v1/notifications/{id}/read -> mark as read
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_workspace
from app.auth.models import User, Workspace

from .service import get_notifications, get_unread_count, mark_as_read

router = APIRouter(prefix="/v1/notifications", tags=["Notifications"])


class NotificationResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str | None
    title: str
    message: str
    type: str
    link: str | None
    read: bool
    created_at: str


class NotificationCountResponse(BaseModel):
    count: int


@router.get("", response_model=list[NotificationResponse], summary="List notifications")
async def list_notifications(
    limit: int = 20,
    offset: int = 0,
    user: User = Depends(get_current_user),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    notifs = await get_notifications(db, workspace.id, user.id, limit=limit, offset=offset)
    return [
        NotificationResponse(
            id=n.id,
            workspace_id=n.workspace_id,
            user_id=n.user_id,
            title=n.title,
            message=n.message,
            type=n.type,
            link=n.link,
            read=n.read,
            created_at=n.created_at.isoformat(),
        )
        for n in notifs
    ]


@router.get("/count", response_model=NotificationCountResponse, summary="Unread notification count")
async def notification_count(
    user: User = Depends(get_current_user),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    count = await get_unread_count(db, workspace.id, user.id)
    return NotificationCountResponse(count=count)


@router.put("/{notification_id}/read", summary="Mark notification as read")
async def mark_notification_read(
    notification_id: str,
    user: User = Depends(get_current_user),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    found = await mark_as_read(db, notification_id, workspace.id)
    if not found:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "ok"}
