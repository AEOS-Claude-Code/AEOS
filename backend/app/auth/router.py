"""
AEOS – Auth API router.

POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
"""

from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status

logger = logging.getLogger("aeos.auth")
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    AuthTokens,
    UserResponse,
)
from app.auth.service import (
    get_user_by_email,
    register_user,
    verify_password,
    hash_password,
    create_access_token,
    create_refresh_token,
    get_refresh_token,
    revoke_user_tokens,
    get_default_membership,
    get_permissions,
)
from app.auth.dependencies import get_current_user, get_current_membership
from app.auth.models import User, Membership, Workspace

router = APIRouter(prefix="/v1/auth", tags=["Authentication"])

# Dummy hash for constant-time comparison when user not found
_DUMMY_HASH = hash_password("dummy-password-for-timing")


@router.post(
    "/register",
    response_model=AuthTokens,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user and workspace",
)
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user, workspace, membership = await register_user(
        db,
        email=body.email,
        password=body.password,
        full_name=body.full_name,
        company_name=body.company_name or "",
        website_url=body.website_url,
    )

    access_token = create_access_token(user.id, workspace.id)
    refresh = await create_refresh_token(db, user.id)

    # Create billing subscription + token wallet for the new workspace
    try:
        from app.modules.billing.service import get_or_create_subscription
        await get_or_create_subscription(db, workspace.id)
        await db.flush()
    except Exception:
        logger.exception("Billing setup failed for workspace=%s (non-fatal)", workspace.id)

    # Auto-trigger Smart Intake in background + queue company scan
    # NOTE: We do NOT block the register response on heavy I/O.
    # The intake + scan will run when the user hits the onboarding page.
    if body.website_url and body.website_url.strip():
        url = body.website_url.strip()

        # Save website URL to profile (already done above) and schedule
        # background intake. The onboarding company page will call
        # /api/v1/onboarding/intake-from-url if no cached results exist,
        # so data is available when the user gets there.
        import asyncio

        async def _background_intake():
            """Run intake + scan in background after response is sent."""
            try:
                from app.core.database import async_session_factory
                from app.engines.smart_intake_engine.service import intake_from_url

                intake_data = await intake_from_url(url)

                async with async_session_factory() as bg_db:
                    from sqlalchemy import select
                    from app.auth.models import WorkspaceProfile, OnboardingProgress

                    result = await bg_db.execute(
                        select(WorkspaceProfile).where(WorkspaceProfile.workspace_id == workspace.id)
                    )
                    profile = result.scalar_one_or_none()
                    if profile:
                        if intake_data.get("detected_company_name"):
                            ws_result = await bg_db.execute(
                                select(Workspace).where(Workspace.id == workspace.id)
                            )
                            ws = ws_result.scalar_one_or_none()
                            if ws:
                                ws.name = intake_data["detected_company_name"]

                        if intake_data.get("detected_industry"):
                            profile.industry = intake_data["detected_industry"]

                        social_raw = intake_data.get("detected_social_links", {})
                        social_flat = {}
                        for platform, urls in social_raw.items():
                            if urls:
                                social_flat[platform] = urls[0]
                        if social_flat:
                            profile.social_links = social_flat

                        phones = intake_data.get("detected_phone_numbers", [])
                        if phones:
                            profile.phone = phones[0]

                        whatsapp = intake_data.get("detected_whatsapp_links", [])
                        if whatsapp:
                            profile.whatsapp_link = whatsapp[0]

                        contacts = intake_data.get("detected_contact_pages", [])
                        if contacts:
                            profile.contact_page = contacts[0]

                        if intake_data.get("detected_country"):
                            profile.country = intake_data["detected_country"]
                        if intake_data.get("detected_city"):
                            profile.city = intake_data["detected_city"]

                        tech = intake_data.get("detected_tech_stack", [])
                        if tech:
                            profile.tech_stack = tech

                        emails = intake_data.get("detected_emails", [])
                        if emails:
                            profile.emails = emails

                        if intake_data.get("og_image"):
                            profile.og_image = intake_data["og_image"]
                        if intake_data.get("favicon_url"):
                            profile.favicon_url = intake_data["favicon_url"]
                        if intake_data.get("detected_business_hours"):
                            profile.business_hours = intake_data["detected_business_hours"]
                        if intake_data.get("detected_languages"):
                            profile.content_languages = intake_data["detected_languages"]
                        if intake_data.get("detected_competitors"):
                            profile.detected_competitors_data = intake_data["detected_competitors"]
                        if intake_data.get("detected_keywords"):
                            profile.seo_keywords = intake_data["detected_keywords"]
                        if intake_data.get("detected_team"):
                            profile.detected_team = intake_data["detected_team"]
                        if intake_data.get("detected_services"):
                            profile.detected_services = intake_data["detected_services"]
                        if intake_data.get("detected_seo_health"):
                            profile.detected_seo_health = intake_data["detected_seo_health"]

                        await bg_db.flush()

                        ob_result = await bg_db.execute(
                            select(OnboardingProgress).where(OnboardingProgress.workspace_id == workspace.id)
                        )
                        ob = ob_result.scalar_one_or_none()
                        if ob:
                            ob.step_company = True
                            ob.step_presence = True
                            ob.current_step = max(ob.current_step, 3)
                            await bg_db.flush()

                    await bg_db.commit()
                    logger.info("Background intake completed for workspace=%s", workspace.id)

                    # Also run company scan in same background flow
                    try:
                        from app.engines.company_scanner_engine.service import run_scan
                        await run_scan(bg_db, workspace.id, url)
                        await bg_db.commit()
                    except Exception:
                        logger.exception("Background scan failed for workspace=%s", workspace.id)

            except Exception:
                logger.exception("Background intake failed for workspace=%s", workspace.id)

        # Fire and forget — don't block the response
        asyncio.ensure_future(_background_intake())

    logger.info("User registered: %s workspace=%s", user.email, workspace.id)
    return AuthTokens(
        access_token=access_token,
        refresh_token=refresh.token,
    )


@router.post(
    "/login",
    response_model=AuthTokens,
    summary="Login with email and password",
)
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, body.email)

    # Constant-time comparison: always verify a password to prevent timing attacks
    if not user:
        verify_password(body.password, _DUMMY_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    membership = await get_default_membership(db, user.id)
    workspace_id = membership.workspace_id if membership else ""

    access_token = create_access_token(user.id, workspace_id)
    refresh = await create_refresh_token(db, user.id)

    logger.info("User logged in: %s", user.email)
    return AuthTokens(
        access_token=access_token,
        refresh_token=refresh.token,
    )


@router.post(
    "/logout",
    summary="Logout – revoke all refresh tokens",
)
async def logout(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await revoke_user_tokens(db, user.id)
    logger.info("User logged out: %s", user.email)
    return {"status": "logged_out"}


@router.post(
    "/refresh",
    response_model=AuthTokens,
    summary="Refresh access token",
)
async def refresh(request: Request, body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token_record = await get_refresh_token(db, body.refresh_token)
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if token_record.is_expired:
        token_record.revoked = True
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    # Revoke old token and persist before issuing new ones
    token_record.revoked = True
    await db.flush()

    # Get user's workspace
    membership = await get_default_membership(db, token_record.user_id)
    workspace_id = membership.workspace_id if membership else ""

    # Issue new tokens
    new_access = create_access_token(token_record.user_id, workspace_id)
    new_refresh = await create_refresh_token(db, token_record.user_id)

    return AuthTokens(
        access_token=new_access,
        refresh_token=new_refresh.token,
    )


@router.post(
    "/change-password",
    summary="Change password for current user",
)
async def change_password(
    request: Request,
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_password = body.get("current_password", "")
    new_password = body.get("new_password", "")

    if not current_password or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both current_password and new_password are required",
        )

    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters",
        )

    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    user.hashed_password = hash_password(new_password)
    await db.flush()
    logger.info("Password changed for user: %s", user.email)
    return {"status": "password_changed"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
async def me(
    user: User = Depends(get_current_user),
    membership: Membership = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
):
    permissions = get_permissions(membership.role)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        initials=user.initials,
        role=membership.role,
        is_active=user.is_active,
        workspace_id=membership.workspace_id,
        workspace_role=membership.role,
        permissions=permissions,
        created_at=user.created_at.isoformat(),
        last_login_at=datetime.utcnow().isoformat(),
    )
