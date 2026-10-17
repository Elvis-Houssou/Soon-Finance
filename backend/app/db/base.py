from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Parent of every table model; Alembic reads `Base.metadata` to autogenerate migrations."""
