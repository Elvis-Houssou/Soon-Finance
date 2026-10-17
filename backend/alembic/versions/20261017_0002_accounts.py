"""accounts: users, login tokens, sessions, profiles, months, goals, events

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-17
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def user_fk() -> sa.ForeignKey:
    return sa.ForeignKey("users.id", ondelete="CASCADE")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("first_name", sa.String(100)),
        sa.Column("locale", sa.String(8), nullable=False),
        sa.Column("currency", sa.String(8), nullable=False),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("consent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "login_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("locale", sa.String(8), nullable=False),
        sa.Column("next_path", sa.String(500)),
        sa.Column("ip_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "sessions",
        sa.Column("id_hash", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.String(36), user_fk(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "profiles",
        sa.Column("user_id", sa.String(36), user_fk(), primary_key=True),
        sa.Column("essentials", sa.Integer),
        sa.Column("has_debt", sa.Boolean),
        sa.Column("savings", sa.Integer),
    )
    op.create_table(
        "months",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), user_fk(), nullable=False),
        sa.Column("year_month", sa.String(7), nullable=False),
        sa.Column("income", sa.Integer, nullable=False),
        sa.Column("currency", sa.String(8), nullable=False),
        sa.Column("method", sa.String(32), nullable=False),
        sa.Column("envelopes", sa.JSON, nullable=False),
        sa.Column("review_went_well", sa.Text),
        sa.Column("review_change_next", sa.Text),
        sa.Column("helpfulness", sa.Integer),
        sa.Column("closed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "year_month"),
    )
    op.create_table(
        "goals",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), user_fk(), nullable=False),
        sa.Column("label", sa.String(200), nullable=False),
        sa.Column("target", sa.Integer, nullable=False),
        sa.Column("deadline", sa.String(7), nullable=False),
        sa.Column("saved", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "events",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("type", sa.String(64), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("locale", sa.String(8)),
        sa.Column("currency", sa.String(8)),
        sa.Column("anon_id", sa.String(64)),
    )


def downgrade() -> None:
    for table in ("events", "goals", "months", "profiles", "sessions", "login_tokens", "users"):
        op.drop_table(table)
