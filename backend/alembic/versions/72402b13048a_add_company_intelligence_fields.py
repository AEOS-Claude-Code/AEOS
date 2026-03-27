"""Add company intelligence fields to workspace_profiles

Revision ID: 72402b13048a
Revises:
Create Date: 2026-03-27

Adds all extended intake / company-intelligence columns that were previously
collected by the smart intake engine but never persisted to the database.
Uses ADD COLUMN IF NOT EXISTS so the migration is safe to run multiple times.
"""

from alembic import op

# revision identifiers
revision = "72402b13048a"
down_revision = None
branch_labels = None
depends_on = None

# ---------------------------------------------------------------------------
# All new columns grouped by category
# ---------------------------------------------------------------------------
_NEW_COLUMNS = [
    # Basic page metadata
    ("page_title",           "VARCHAR(500)  DEFAULT ''"),
    ("meta_description",     "TEXT          DEFAULT ''"),
    ("detected_description", "TEXT          DEFAULT ''"),
    ("detected_address",     "VARCHAR(500)  DEFAULT ''"),
    ("is_bot_blocked",       "BOOLEAN       DEFAULT FALSE"),

    # Industry intelligence
    ("industry_confidence",  "FLOAT         DEFAULT 0.0"),
    ("industry_scores",      "JSONB         DEFAULT '{}'::jsonb"),
    ("industry_signals",     "JSONB         DEFAULT '[]'::jsonb"),

    # Full contact lists (not just first item)
    ("phone_numbers",        "JSONB         DEFAULT '[]'::jsonb"),
    ("whatsapp_links",       "JSONB         DEFAULT '[]'::jsonb"),
    ("contact_pages",        "JSONB         DEFAULT '[]'::jsonb"),
    ("booking_pages",        "JSONB         DEFAULT '[]'::jsonb"),

    # Company intelligence (#9-20)
    ("detected_employee_count", "INTEGER"),
    ("company_stage",           "VARCHAR(100)  DEFAULT ''"),
    ("target_audience",         "VARCHAR(100)  DEFAULT ''"),
    ("audience_keywords",       "JSONB         DEFAULT '[]'::jsonb"),
    ("logo_url",                "VARCHAR(1000) DEFAULT ''"),
    ("office_locations",        "JSONB         DEFAULT '[]'::jsonb"),
    ("service_descriptions",    "JSONB         DEFAULT '[]'::jsonb"),
    ("certifications",          "JSONB         DEFAULT '[]'::jsonb"),
    ("growth_signals",          "JSONB         DEFAULT '{}'::jsonb"),
    ("competitive_positioning", "VARCHAR(100)  DEFAULT ''"),
    ("content_maturity",        "JSONB         DEFAULT '{}'::jsonb"),
    ("financial_indicators",    "JSONB         DEFAULT '{}'::jsonb"),
]


def upgrade() -> None:
    for col_name, col_def in _NEW_COLUMNS:
        op.execute(
            f"ALTER TABLE workspace_profiles "
            f"ADD COLUMN IF NOT EXISTS {col_name} {col_def};"
        )


def downgrade() -> None:
    for col_name, _ in reversed(_NEW_COLUMNS):
        op.execute(
            f"ALTER TABLE workspace_profiles "
            f"DROP COLUMN IF EXISTS {col_name};"
        )
