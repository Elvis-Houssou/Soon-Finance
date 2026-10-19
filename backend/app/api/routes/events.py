from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.db.models import Event
from app.db.session import get_session
from app.schemas.account import EventIn
from app.services import auth

router = APIRouter()


@router.post("/events", status_code=204)
def post_event(body: EventIn, db: Session = Depends(get_session)):
    db.add(Event(occurred_at=auth.now(), **body.model_dump()))
    db.commit()
    return Response(status_code=204)
