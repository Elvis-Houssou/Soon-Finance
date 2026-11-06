"""link savings goals to a project template

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-06
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("goals", sa.Column("template_id", sa.String(64), nullable=True))
    op.create_index("ix_goals_template_id", "goals", ["template_id"])


def downgrade() -> None:
    op.drop_index("ix_goals_template_id", table_name="goals")
    op.drop_column("goals", "template_id")
