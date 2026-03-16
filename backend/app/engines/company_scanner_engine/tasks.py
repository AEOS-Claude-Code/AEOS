"""
AEOS – Company Scanner Engine: Celery tasks.

Background task for website scanning that doesn't block the API.
Uses sync DB session since Celery workers run in sync context.
"""

from __future__ import annotations

import asyncio
from datetime import datetime

from app.core.celery_app import celery_app
from app.core.database import async_session_factory
from app.engines.company_scanner_engine.service import run_scan


@celery_app.task(
    name="company_scanner.scan_website",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
)
def scan_company_website(self, workspace_id: str, website_url: str, social_links: dict | None = None):
    """
    Background task: scan a company website.

    Called after onboarding completes or manually from the dashboard.
    Runs the full pipeline: Website → SEO → Social → Tech → Save.
    """
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                _async_scan(workspace_id, website_url, social_links)
            )
            return result
        finally:
            loop.close()
    except Exception as exc:
        raise self.retry(exc=exc)


async def _async_scan(workspace_id: str, website_url: str, social_links: dict | None) -> dict:
    """Run the scan inside an async session."""
    async with async_session_factory() as db:
        try:
            report = await run_scan(db, workspace_id, website_url, social_links)
            await db.commit()
            return {
                "scan_id": report.id,
                "status": report.status,
                "seo_score": report.seo_score,
                "website_url": website_url,
            }
        except Exception:
            await db.rollback()
            raise
