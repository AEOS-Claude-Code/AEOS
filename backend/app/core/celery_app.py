"""
AEOS – Celery application.
"""

from __future__ import annotations

from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "aeos",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "cleanup-refresh-tokens": {
            "task": "auth.cleanup_refresh_tokens",
            "schedule": 86400.0,  # every 24 hours
        },
    },
)

# Auto-discover tasks inside every module that has a tasks.py
celery_app.autodiscover_tasks(
    [
        "app.auth",
        "app.modules.marketing",
        "app.modules.hr",
        "app.modules.finance",
        "app.modules.operations",
        "app.modules.executive",
        "app.engines.digital_presence_engine",
        "app.engines.lead_intelligence_engine",
        "app.engines.opportunity_intelligence_engine",
        "app.engines.competitor_intelligence_engine",
        "app.engines.strategic_intelligence_engine",
        "app.engines.company_scanner_engine",
    ],
    related_name="tasks",
)
