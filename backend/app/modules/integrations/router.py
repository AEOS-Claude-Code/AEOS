"""
AEOS – Integrations Hub: API Router.

GET  /api/v1/integrations                    → List all providers with connection status
GET  /api/v1/integrations/oauth/google/authorize → Get Google OAuth authorization URL
GET  /api/v1/integrations/oauth/google/callback  → Google OAuth callback (redirect from Google)
GET  /api/v1/integrations/oauth/status           → Check OAuth authorization status
POST /api/v1/integrations/connect            → Connect a provider (simulated OAuth)
POST /api/v1/integrations/disconnect         → Disconnect a provider
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy import select as sa_select
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
    OAuthAuthorizeResponse,
    OAuthStatusResponse,
)
from .service import list_integrations, connect_provider, disconnect_provider

logger = logging.getLogger("aeos.integrations.router")

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


# ── OAuth endpoints ──────────────────────────────────────────────────


@router.get(
    "/oauth/google/authorize",
    response_model=OAuthAuthorizeResponse,
    summary="Get Google OAuth authorization URL",
)
async def oauth_google_authorize(
    provider_id: str = Query(..., description="google_analytics, google_search_console, or google_ads"),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    from app.core.config import get_settings
    from .providers.google_provider import (
        GOOGLE_PROVIDERS, generate_code_verifier, generate_code_challenge,
        generate_state_token, build_authorization_url, ALL_SCOPES,
    )
    from .models import OAuthState

    settings = get_settings()
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")

    if provider_id not in GOOGLE_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Invalid Google provider: {provider_id}")

    # Generate PKCE
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    state_token = generate_state_token()

    # Store OAuth state
    oauth_state = OAuthState(
        state_token=state_token,
        workspace_id=workspace.id,
        user_id=workspace.id,  # We'll use workspace.id as user context
        provider_id=provider_id,
        scopes=ALL_SCOPES,
        code_verifier=code_verifier,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    db.add(oauth_state)
    await db.flush()

    # Build authorization URL
    auth_url = build_authorization_url(
        client_id=settings.GOOGLE_CLIENT_ID,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
        state=state_token,
        code_challenge=code_challenge,
    )

    return OAuthAuthorizeResponse(authorization_url=auth_url, state=state_token)


@router.get(
    "/oauth/google/callback",
    response_class=HTMLResponse,
    summary="Google OAuth callback (redirect from Google)",
)
async def oauth_google_callback(
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    from app.core.config import get_settings
    from .providers.google_provider import (
        GOOGLE_PROVIDERS, exchange_code_for_tokens, get_user_info,
    )
    from .models import OAuthState, Integration, IntegrationCredential
    from app.core.events import EventType, publish_event

    settings = get_settings()
    frontend_url = settings.FRONTEND_URL

    def _html_response(success: bool, message: str, provider_id: str = "") -> HTMLResponse:
        status = "connected" if success else "error"
        return HTMLResponse(f"""<!DOCTYPE html>
<html><head><title>AEOS OAuth</title></head>
<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;">
<div style="text-align:center;padding:40px;">
<h2 style="color:{'#10b981' if success else '#ef4444'}">{'Connected!' if success else 'Connection Failed'}</h2>
<p style="color:#6b7280">{message}</p>
<p style="color:#9ca3af;font-size:14px">This window will close automatically...</p>
</div>
<script>
if (window.opener) {{
    window.opener.postMessage({{
        type: "oauth_complete",
        status: "{status}",
        provider_id: "{provider_id}",
        message: "{message}"
    }}, "{frontend_url}");
}}
setTimeout(function() {{ window.close(); }}, 2000);
</script>
</body></html>""")

    if error:
        return _html_response(False, f"Google authorization denied: {error}")

    if not code or not state:
        return _html_response(False, "Missing authorization code or state")

    # Validate state
    result = await db.execute(
        sa_select(OAuthState).where(
            OAuthState.state_token == state,
            OAuthState.consumed == False,
        )
    )
    oauth_state = result.scalar_one_or_none()

    if not oauth_state:
        return _html_response(False, "Invalid or expired authorization state")

    if oauth_state.expires_at < datetime.utcnow():
        return _html_response(False, "Authorization state expired")

    # Mark as consumed
    oauth_state.consumed = True
    await db.flush()

    try:
        # Exchange code for tokens
        tokens = await exchange_code_for_tokens(
            code=code,
            code_verifier=oauth_state.code_verifier,
            redirect_uri=settings.GOOGLE_REDIRECT_URI,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )

        # Get user info for display
        user_info = await get_user_info(tokens["access_token"])
        account_name = user_info.get("email") or user_info.get("name") or "Google Account"
        account_id = user_info.get("email") or ""

        expires_at = datetime.utcnow() + timedelta(seconds=tokens.get("expires_in", 3600))

        # Connect ALL Google providers with shared tokens
        for pid in GOOGLE_PROVIDERS:
            # Upsert Integration
            intg_result = await db.execute(
                sa_select(Integration).where(
                    Integration.workspace_id == oauth_state.workspace_id,
                    Integration.provider_id == pid,
                )
            )
            intg = intg_result.scalar_one_or_none()
            if not intg:
                intg = Integration(workspace_id=oauth_state.workspace_id, provider_id=pid)
                db.add(intg)
                await db.flush()

            intg.status = "connected"
            intg.display_name = account_name
            intg.connected_at = datetime.utcnow()
            intg.error_message = ""

            # Upsert Credential
            cred_result = await db.execute(
                sa_select(IntegrationCredential).where(
                    IntegrationCredential.integration_id == intg.id
                )
            )
            cred = cred_result.scalar_one_or_none()
            if not cred:
                cred = IntegrationCredential(integration_id=intg.id)
                db.add(cred)

            cred.access_token = tokens["access_token"]
            cred.refresh_token = tokens.get("refresh_token", "")
            cred.token_type = tokens.get("token_type", "Bearer")
            cred.expires_at = expires_at
            cred.scope = tokens.get("scope", "")
            cred.external_account_id = account_id
            cred.external_account_name = account_name

            await publish_event(
                EventType.INTEGRATION_CONNECTED,
                workspace_id=oauth_state.workspace_id,
                engine="integrations",
                payload={"provider_id": pid, "display_name": account_name},
            )

        await db.commit()
        return _html_response(True, f"Connected as {account_name}", oauth_state.provider_id)

    except Exception as e:
        logger.exception("Google OAuth callback failed")
        await db.rollback()
        return _html_response(False, f"Token exchange failed: {str(e)[:200]}")


@router.get(
    "/oauth/meta/authorize",
    response_model=OAuthAuthorizeResponse,
    summary="Get Meta OAuth authorization URL",
)
async def oauth_meta_authorize(
    provider_id: str = Query(..., description="meta or instagram"),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    from app.core.config import get_settings
    from .providers.meta_provider import (
        META_PROVIDERS, generate_state_token, build_authorization_url, SCOPES,
    )
    from .models import OAuthState

    settings = get_settings()
    if not settings.META_APP_ID:
        raise HTTPException(status_code=501, detail="Meta OAuth not configured. Set META_APP_ID and META_APP_SECRET.")

    if provider_id not in META_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Invalid Meta provider: {provider_id}")

    state_token = generate_state_token()

    # Store OAuth state (no code_verifier — Meta doesn't support PKCE)
    oauth_state = OAuthState(
        state_token=state_token,
        workspace_id=workspace.id,
        user_id=workspace.id,
        provider_id=provider_id,
        scopes=SCOPES,
        code_verifier="",
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    db.add(oauth_state)
    await db.flush()

    auth_url = build_authorization_url(
        app_id=settings.META_APP_ID,
        redirect_uri=settings.META_REDIRECT_URI,
        state=state_token,
    )

    return OAuthAuthorizeResponse(authorization_url=auth_url, state=state_token)


@router.get(
    "/oauth/meta/callback",
    response_class=HTMLResponse,
    summary="Meta OAuth callback (redirect from Facebook)",
)
async def oauth_meta_callback(
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    from app.core.config import get_settings
    from .providers.meta_provider import (
        META_PROVIDERS, exchange_code_for_tokens, exchange_long_lived_token, get_user_info,
    )
    from .models import OAuthState, Integration, IntegrationCredential
    from app.core.events import EventType, publish_event

    settings = get_settings()
    frontend_url = settings.FRONTEND_URL

    def _html_response(success: bool, message: str, provider_id: str = "") -> HTMLResponse:
        status = "connected" if success else "error"
        return HTMLResponse(f"""<!DOCTYPE html>
<html><head><title>AEOS OAuth</title></head>
<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;">
<div style="text-align:center;padding:40px;">
<h2 style="color:{'#10b981' if success else '#ef4444'}">{'Connected!' if success else 'Connection Failed'}</h2>
<p style="color:#6b7280">{message}</p>
<p style="color:#9ca3af;font-size:14px">This window will close automatically...</p>
</div>
<script>
if (window.opener) {{
    window.opener.postMessage({{
        type: "oauth_complete",
        status: "{status}",
        provider_id: "{provider_id}",
        message: "{message}"
    }}, "{frontend_url}");
}}
setTimeout(function() {{ window.close(); }}, 2000);
</script>
</body></html>""")

    if error:
        return _html_response(False, f"Meta authorization denied: {error}")

    if not code or not state:
        return _html_response(False, "Missing authorization code or state")

    # Validate state
    result = await db.execute(
        sa_select(OAuthState).where(
            OAuthState.state_token == state,
            OAuthState.consumed == False,
        )
    )
    oauth_state = result.scalar_one_or_none()

    if not oauth_state:
        return _html_response(False, "Invalid or expired authorization state")

    if oauth_state.expires_at < datetime.utcnow():
        return _html_response(False, "Authorization state expired")

    # Mark as consumed
    oauth_state.consumed = True
    await db.flush()

    try:
        # Exchange code for short-lived token
        short_tokens = await exchange_code_for_tokens(
            code=code,
            redirect_uri=settings.META_REDIRECT_URI,
            app_id=settings.META_APP_ID,
            app_secret=settings.META_APP_SECRET,
        )

        short_token = short_tokens["access_token"]

        # Exchange short-lived token for long-lived token (~60 days)
        long_tokens = await exchange_long_lived_token(
            short_token=short_token,
            app_id=settings.META_APP_ID,
            app_secret=settings.META_APP_SECRET,
        )

        access_token = long_tokens["access_token"]
        expires_in = long_tokens.get("expires_in", 5184000)  # default 60 days

        # Get user info
        user_info = await get_user_info(access_token)
        account_name = user_info.get("name") or user_info.get("email") or "Meta Account"
        account_id = user_info.get("id") or ""

        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        # Connect BOTH "meta" and "instagram" providers with shared tokens
        for pid in META_PROVIDERS:
            # Upsert Integration
            intg_result = await db.execute(
                sa_select(Integration).where(
                    Integration.workspace_id == oauth_state.workspace_id,
                    Integration.provider_id == pid,
                )
            )
            intg = intg_result.scalar_one_or_none()
            if not intg:
                intg = Integration(workspace_id=oauth_state.workspace_id, provider_id=pid)
                db.add(intg)
                await db.flush()

            intg.status = "connected"
            intg.display_name = account_name
            intg.connected_at = datetime.utcnow()
            intg.error_message = ""

            # Upsert Credential
            cred_result = await db.execute(
                sa_select(IntegrationCredential).where(
                    IntegrationCredential.integration_id == intg.id
                )
            )
            cred = cred_result.scalar_one_or_none()
            if not cred:
                cred = IntegrationCredential(integration_id=intg.id)
                db.add(cred)

            cred.access_token = access_token
            cred.refresh_token = ""  # Meta long-lived tokens don't have refresh tokens
            cred.token_type = long_tokens.get("token_type", "bearer")
            cred.expires_at = expires_at
            cred.scope = long_tokens.get("scope", "")
            cred.external_account_id = account_id
            cred.external_account_name = account_name

            await publish_event(
                EventType.INTEGRATION_CONNECTED,
                workspace_id=oauth_state.workspace_id,
                engine="integrations",
                payload={"provider_id": pid, "display_name": account_name},
            )

        await db.commit()
        return _html_response(True, f"Connected as {account_name}", oauth_state.provider_id)

    except Exception as e:
        logger.exception("Meta OAuth callback failed")
        await db.rollback()
        return _html_response(False, f"Token exchange failed: {str(e)[:200]}")


@router.get(
    "/oauth/status",
    response_model=OAuthStatusResponse,
    summary="Check OAuth authorization status",
)
async def oauth_status(
    state: str = Query(...),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    from .models import OAuthState, Integration
    from .providers.google_provider import GOOGLE_PROVIDERS

    result = await db.execute(
        sa_select(OAuthState).where(
            OAuthState.state_token == state,
            OAuthState.workspace_id == workspace.id,
        )
    )
    oauth_state = result.scalar_one_or_none()

    if not oauth_state:
        return OAuthStatusResponse(status="expired", message="State not found")

    if not oauth_state.consumed:
        if oauth_state.expires_at < datetime.utcnow():
            return OAuthStatusResponse(status="expired", provider_id=oauth_state.provider_id, message="Authorization expired")
        return OAuthStatusResponse(status="pending", provider_id=oauth_state.provider_id)

    # Check if the integration is actually connected
    intg_result = await db.execute(
        sa_select(Integration).where(
            Integration.workspace_id == workspace.id,
            Integration.provider_id == oauth_state.provider_id,
        )
    )
    intg = intg_result.scalar_one_or_none()

    if intg and intg.status == "connected":
        return OAuthStatusResponse(status="connected", provider_id=oauth_state.provider_id, message=f"Connected as {intg.display_name}")
    elif intg and intg.status == "error":
        return OAuthStatusResponse(status="error", provider_id=oauth_state.provider_id, message=intg.error_message)
    else:
        return OAuthStatusResponse(status="pending", provider_id=oauth_state.provider_id)


# ── Existing endpoints ───────────────────────────────────────────────


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
