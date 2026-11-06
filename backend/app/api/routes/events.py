from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Event
from app.db.session import get_session
from app.schemas.account import EventIn
from app.services import auth

router = APIRouter()


@router.post("/events", status_code=204)
def post_event(body: EventIn, db: Session = Depends(get_session)):
    now = auth.now()
    # Anonymous event ingestion is public. Cap each anonymous browser identifier
    # to 60 events/hour to limit accidental loops and low-effort abuse.
    recent = db.scalar(
        select(func.count()).select_from(Event).where(
            Event.anon_id == body.anon_id,
            Event.occurred_at > now - timedelta(hours=1),
        )
    ) or 0
    if recent >= 60:
        raise HTTPException(status_code=429, detail="event_rate_limited")
    db.add(Event(occurred_at=now, **body.model_dump()))
    db.commit()
    return Response(status_code=204)
