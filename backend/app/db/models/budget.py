from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Profile(Base):
    __tablename__ = "profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    essentials: Mapped[int | None] = mapped_column(Integer)
    has_debt: Mapped[bool | None] = mapped_column(Boolean)
    savings: Mapped[int | None] = mapped_column(Integer)


class Month(Base):
    __tablename__ = "months"
    __table_args__ = (UniqueConstraint("user_id", "year_month"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    year_month: Mapped[str] = mapped_column(String(7))
    income: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8))
    method: Mapped[str] = mapped_column(String(32))
    envelopes: Mapped[list] = mapped_column(JSON)
    review_went_well: Mapped[str | None] = mapped_column(Text)
    review_change_next: Mapped[str | None] = mapped_column(Text)
    helpfulness: Mapped[int | None] = mapped_column(Integer)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    label: Mapped[str] = mapped_column(String(200))
    target: Mapped[int] = mapped_column(Integer)
    deadline: Mapped[str] = mapped_column(String(7))
    saved: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
