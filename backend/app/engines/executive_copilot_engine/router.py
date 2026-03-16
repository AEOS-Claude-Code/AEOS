"""
AEOS – Executive Copilot Engine: API Router.

POST /api/v1/copilot/ask  → Ask AEOS a business question
GET  /api/v1/copilot/history → Recent conversation history
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_workspace
from app.auth.models import User, Workspace
from .schemas import CopilotAskRequest, CopilotResponse
from .models import CopilotConversation
from .service import ask_copilot

router = APIRouter(prefix="/v1/copilot", tags=["Executive Copilot"])


@router.post(
    "/ask",
    response_model=CopilotResponse,
    summary="Ask AEOS a business question",
    description="Natural-language Q&A powered by all intelligence engines.",
)
async def ask(
    body: CopilotAskRequest,
    user: User = Depends(get_current_user),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    return await ask_copilot(db, workspace, user.id, body.question)


@router.get(
    "/history",
    summary="Recent copilot conversation history",
)
async def history(
    limit: int = Query(10, ge=1, le=50),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CopilotConversation)
        .where(CopilotConversation.workspace_id == workspace.id)
        .order_by(CopilotConversation.created_at.desc())
        .limit(limit)
    )
    convos = list(result.scalars().all())
    return {
        "workspace_id": workspace.id,
        "conversations": [
            {
                "id": c.id,
                "question": c.question,
                "answer": c.answer,
                "sources": c.sources or [],
                "confidence": c.confidence,
                "created_at": c.created_at.isoformat(),
            }
            for c in convos
        ],
    }
