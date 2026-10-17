from datetime import datetime

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.types import UTCDateTime


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(64))
    occurred_at: Mapped[datetime] = mapped_column(UTCDateTime)
    locale: Mapped[str | None] = mapped_column(String(8))
    currency: Mapped[str | None] = mapped_column(String(8))
    anon_id: Mapped[str | None] = mapped_column(String(64))
