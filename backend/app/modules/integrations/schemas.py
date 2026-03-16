"""
AEOS – Integrations Hub: Pydantic schemas.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ── Provider catalog ─────────────────────────────────────────────────

class ProviderInfo(BaseModel):
    id: str
    name: str
    category: str
    description: str
    icon: str
    oauth_required: bool


# ── Integration state ────────────────────────────────────────────────

class IntegrationResponse(BaseModel):
    id: str
    provider_id: str
    provider_name: str
    category: str
    description: str
    icon: str
    status: str
    display_name: str
    connected_at: Optional[str] = None
    last_sync_at: Optional[str] = None
    error_message: str = ""


class IntegrationListResponse(BaseModel):
    workspace_id: str
    total: int
    connected: int
    integrations: list[IntegrationResponse]


# ── Connect / disconnect ─────────────────────────────────────────────

class ConnectRequest(BaseModel):
    provider_id: str = Field(..., description="Provider ID from the catalog (e.g. 'google_analytics')")
    config: dict = Field(default_factory=dict, description="Optional provider-specific config")

    # Simulated OAuth fields (in production, these come from OAuth callback)
    simulated_account_name: str = Field(default="", description="Simulated external account name")


class ConnectResponse(BaseModel):
    integration_id: str
    provider_id: str
    provider_name: str
    status: str
    message: str


class DisconnectRequest(BaseModel):
    provider_id: str


class DisconnectResponse(BaseModel):
    provider_id: str
    status: str
    message: str
