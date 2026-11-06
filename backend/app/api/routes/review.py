from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.models import Month, User
from app.db.session import get_session
from app.domain.review import monthly_review

router = APIRouter()


@router.get("/monthly-review")
def get_monthly_review(db: Session = Depends(get_session), user: User = Depends(current_user)):
    months = list(db.scalars(select(Month).where(Month.user_id == user.id, Month.closed_at.is_not(None))))
    return monthly_review(months)
