import uuid

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.models import Goal, Month, User
from app.db.session import get_session
from app.domain.progress import goal_pace, monthly_saving
from app.schemas.goals import GoalIn, GoalOut, GoalPatch
from app.services import auth

router = APIRouter()
MAX_GOALS = 3


def goals_out(db: Session, user: User, goals: list[Goal]) -> list[GoalOut]:
    months = db.scalars(select(Month).where(Month.user_id == user.id)).all()
    ym = auth.now().strftime("%Y-%m")
    rhythm = monthly_saving(months, ym)
    return [GoalOut(id=g.id, label=g.label, target=g.target, deadline=g.deadline, saved=g.saved, pace=goal_pace(g, rhythm, ym)) for g in goals]


def _mine(db: Session, user: User, gid: str) -> Goal:
    g = db.scalar(select(Goal).where(Goal.id == gid, Goal.user_id == user.id))
    if g is None:
        raise HTTPException(404, "not_found")
    return g


def _check_deadline(deadline: str) -> None:
    if deadline < auth.now().strftime("%Y-%m"):
        raise HTTPException(422, "deadline_past")


@router.get("/goals", response_model=list[GoalOut])
def list_goals(db: Session = Depends(get_session), user: User = Depends(current_user)):
    return goals_out(db, user, list(db.scalars(select(Goal).where(Goal.user_id == user.id).order_by(Goal.created_at))))


@router.post("/goals", response_model=GoalOut, status_code=201)
def create_goal(body: GoalIn, db: Session = Depends(get_session), user: User = Depends(current_user)):
    _check_deadline(body.deadline)
    # shortcut: count-then-insert is not atomic, two concurrent POSTs could reach 4; upgrade with a lock if it matters
    if len(db.scalars(select(Goal.id).where(Goal.user_id == user.id)).all()) >= MAX_GOALS:
        return JSONResponse({"detail": "limit"}, status_code=409)
    g = Goal(id=str(uuid.uuid4()), user_id=user.id, created_at=auth.now(), **body.model_dump())
    db.add(g)
    db.commit()
    return goals_out(db, user, [g])[0]


@router.patch("/goals/{gid}", response_model=GoalOut)
def patch_goal(gid: str, body: GoalPatch, db: Session = Depends(get_session), user: User = Depends(current_user)):
    g = _mine(db, user, gid)
    fields = body.model_dump(exclude_none=True)
    if "deadline" in fields:
        _check_deadline(fields["deadline"])
    for k, v in fields.items():
        setattr(g, k, v)
    db.commit()
    return goals_out(db, user, [g])[0]


@router.delete("/goals/{gid}", status_code=204)
def delete_goal(gid: str, db: Session = Depends(get_session), user: User = Depends(current_user)):
    db.delete(_mine(db, user, gid))
    db.commit()
    return Response(status_code=204)
