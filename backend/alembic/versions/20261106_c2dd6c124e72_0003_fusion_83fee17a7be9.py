"""0003_fusion_83fee17a7be9

Revision ID: c2dd6c124e72
Revises: 0003, 83fee17a7be9
Create Date: 2026-11-06 10:43:01.474056
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = 'c2dd6c124e72'
down_revision: str | None = ('0003', '83fee17a7be9')
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
