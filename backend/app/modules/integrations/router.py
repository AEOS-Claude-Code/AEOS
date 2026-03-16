"""
AEOS – Integrations Hub: API Router.

GET  /api/v1/integrations           → List all providers with connection status
POST /api/v1/integrations/connect   → Connect a provider (simulated OAuth)
POST /api/v1/integrations/disconnect → Disconnect a provider
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.dependencies import get_current_workspace
from app.auth.models import Workspace
from .schemas import (
    IntegrationListResponse,
    IntegrationResponse,
    ConnectRequest,
    ConnectResponse,
    DisconnectRequest,
    DisconnectResponse,
)
from .service import list_integrations, connect_provider, disconnect_provider

router = APIRouter(prefix="/v1/integrations", tags=["Integrations"])


@router.get(
    "",
    response_model=IntegrationListResponse,
    summary="List all providers with connection status",
)
async def get_integrations(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    items = await list_integrations(db, workspace.id)
    connected = sum(1 for i in items if i["status"] == "connected")

    return IntegrationListResponse(
        workspace_id=workspace.id,
        total=len(items),
        connected=connected,
        integrations=[IntegrationResponse(**i) for i in items],
    )


@router.post(
    "/connect",
    response_model=ConnectResponse,
    summary="Connect a provider (simulated OAuth)",
)
async def connect(
    body: ConnectRequest,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    try:
        intg = await connect_provider(
            db,
            workspace.id,
            body.provider_id,
            body.config,
            body.simulated_account_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    from .models import PROVIDERS
    provider = PROVIDERS.get(body.provider_id, {})

    return ConnectResponse(
        integration_id=intg.id,
        provider_id=intg.provider_id,
        provider_name=provider.get("name", intg.provider_id),
        status=intg.status,
        message=f"Successfully connected {provider.get('name', intg.provider_id)}." if intg.status == "connected" else f"Connection failed: {intg.error_message}",
    )


@router.post(
    "/disconnect",
    response_model=DisconnectResponse,
    summary="Disconnect a provider",
)
async def disconnect(
    body: DisconnectRequest,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    success = await disconnect_provider(db, workspace.id, body.provider_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"No connection found for {body.provider_id}")

    return DisconnectResponse(
        provider_id=body.provider_id,
        status="disconnected",
        message=f"Successfully disconnected {body.provider_id}.",
    )
