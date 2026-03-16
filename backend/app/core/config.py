"""
AEOS – Application configuration.
Reads from environment variables (docker-compose injects .env).
"""

from __future__ import annotations

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── App ──
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # ── Postgres ──
    DATABASE_URL: str = "postgresql+asyncpg://aeos:aeos_secret_change_me@postgres:5432/aeos"
    DATABASE_URL_SYNC: str = "postgresql://aeos:aeos_secret_change_me@postgres:5432/aeos"

    # ── Redis ──
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    # ── JWT ──
    JWT_SECRET_KEY: str = "change-me-to-a-random-64-char-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ──
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    # ── AI ──
    ANTHROPIC_API_KEY: str = ""
    AI_DEFAULT_MODEL: str = "claude-sonnet-4-20250514"
    AI_MAX_TOKENS: int = 4096

    # ── Storage ──
    S3_ENDPOINT_URL: str = ""
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET_NAME: str = "aeos-storage"
    S3_REGION: str = "auto"


@lru_cache
def get_settings() -> Settings:
    return Settings()
