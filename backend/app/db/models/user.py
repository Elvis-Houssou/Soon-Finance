from datetime import datetime

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.types import UTCDateTime


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True)
    first_name: Mapped[str | None] = mapped_column(String(100))
    locale: Mapped[str] = mapped_column(String(8), default="fr")
    currency: Mapped[str] = mapped_column(String(8), default="XOF")
    role: Mapped[str] = mapped_column(String(16), default="user")
    consent_at: Mapped[datetime] = mapped_column(UTCDateTime)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime)
