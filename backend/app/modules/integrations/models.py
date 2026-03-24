"""
AEOS – Integrations Hub: Database models.

Tables:
  integrations            – workspace connection state per provider
  integration_credentials – encrypted token storage per connection
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


# ── Provider catalog (static, not a table) ───────────────────────────

PROVIDERS = {
    "google_search_console": {
        "id": "google_search_console",
        "name": "Google Search Console",
        "category": "seo",
        "description": "Monitor search performance, keywords, and indexing status.",
        "icon": "search",
        "oauth_required": True,
    },
    "google_analytics": {
        "id": "google_analytics",
        "name": "Google Analytics",
        "category": "analytics",
        "description": "Track website traffic, user behavior, and conversions.",
        "icon": "bar_chart",
        "oauth_required": True,
    },
    "meta": {
        "id": "meta",
        "name": "Meta (Facebook & Instagram Ads)",
        "category": "advertising",
        "description": "Track ad performance, reach, and conversion across Meta platforms.",
        "icon": "megaphone",
        "oauth_required": True,
    },
    "instagram": {
        "id": "instagram",
        "name": "Instagram Business",
        "category": "social",
        "description": "Monitor engagement, follower growth, and content performance.",
        "icon": "camera",
        "oauth_required": True,
    },
    "linkedin": {
        "id": "linkedin",
        "name": "LinkedIn",
        "category": "social",
        "description": "Track company page analytics, post engagement, and follower demographics.",
        "icon": "briefcase",
        "oauth_required": True,
    },
    "wordpress": {
        "id": "wordpress",
        "name": "WordPress",
        "category": "cms",
        "description": "Sync blog content, track page analytics, and manage SEO metadata.",
        "icon": "file_text",
        "oauth_required": False,
    },
    "shopify": {
        "id": "shopify",
        "name": "Shopify",
        "category": "ecommerce",
        "description": "Track orders, revenue, product performance, and customer analytics.",
        "icon": "shopping_cart",
        "oauth_required": True,
    },
    "stripe": {
        "id": "stripe",
        "name": "Stripe",
        "category": "payments",
        "description": "Revenue tracking, subscription analytics, and payment health.",
        "icon": "credit_card",
        "oauth_required": True,
    },
    "hubspot": {
        "id": "hubspot",
        "name": "HubSpot",
        "category": "crm",
        "description": "Sync contacts, deals, and marketing data from your CRM.",
        "icon": "users",
        "oauth_required": True,
    },
    "mailchimp": {
        "id": "mailchimp",
        "name": "Mailchimp",
        "category": "email",
        "description": "Email campaign analytics, open rates, and subscriber management.",
        "icon": "mail",
        "oauth_required": True,
    },
    "slack": {
        "id": "slack",
        "name": "Slack",
        "category": "communication",
        "description": "Receive AEOS alerts, lead notifications, and weekly digests in Slack.",
        "icon": "message_square",
        "oauth_required": True,
    },
    "google_ads": {
        "id": "google_ads",
        "name": "Google Ads",
        "category": "advertising",
        "description": "Paid search campaign performance, keywords, and cost tracking.",
        "icon": "target",
        "oauth_required": True,
    },
}


# ── Integration (workspace connection state) ─────────────────────────

class Integration(Base):
    __tablename__ = "integrations"

    id = Column(String(36), primary_key=True, default=_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id = Column(String(100), nullable=False)  # matches PROVIDERS key

    status = Column(String(50), nullable=False, default="disconnected")  # disconnected | connecting | connected | error
    display_name = Column(String(255), default="")
    config = Column(JSON, default=dict)  # provider-specific settings

    connected_at = Column(DateTime, nullable=True)
    disconnected_at = Column(DateTime, nullable=True)
    last_sync_at = Column(DateTime, nullable=True)
    error_message = Column(Text, default="")

    created_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("workspace_id", "provider_id", name="uq_workspace_provider"),
    )


# ── Integration Credentials ──────────────────────────────────────────

class IntegrationCredential(Base):
    __tablename__ = "integration_credentials"

    id = Column(String(36), primary_key=True, default=_uuid)
    integration_id = Column(String(36), ForeignKey("integrations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # OAuth tokens (in production, these would be encrypted at rest)
    access_token = Column(Text, default="")
    refresh_token = Column(Text, default="")
    token_type = Column(String(50), default="bearer")
    expires_at = Column(DateTime, nullable=True)
    scope = Column(Text, default="")

    # API key auth (for providers that use keys instead of OAuth)
    api_key = Column(Text, default="")
    api_secret = Column(Text, default="")

    # Metadata
    external_account_id = Column(String(255), default="")
    external_account_name = Column(String(255), default="")

    created_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)


# ── OAuth State (PKCE + CSRF) ────────────────────────────────────────

class OAuthState(Base):
    __tablename__ = "oauth_states"

    id = Column(String(36), primary_key=True, default=_uuid)
    state_token = Column(String(128), nullable=False, unique=True, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), default="")
    provider_id = Column(String(100), nullable=False)
    scopes = Column(Text, nullable=False)
    code_verifier = Column(String(128), default="")
    redirect_after = Column(String(500), default="")
    created_at = Column(DateTime, default=_now, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    consumed = Column(Boolean, default=False)
