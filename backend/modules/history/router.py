import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from modules.history import crud, service
from modules.history.schemas import HistoryOut
from modules.user.models import User
from modules.user.router import get_current_user
from modules.generate.schemas import GenerateRequest
from typing import List

router = APIRouter()


@router.get("", response_model=List[HistoryOut])
def list_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.get_history_list(db, current_user.id)


@router.get("/{history_id}", response_model=HistoryOut)
def get_history(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    h = crud.get_history_by_id(db, history_id)
    if not h or h.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="이력을 찾을 수 없습니다.")
    return h


@router.delete("/{history_id}", status_code=204)
def delete_history(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    h = crud.get_history_by_id(db, history_id)
    if not h or h.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="이력을 찾을 수 없습니다.")
    crud.delete_history(db, history_id)


@router.post("/{history_id}/regenerate")
async def regenerate(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    h = crud.get_history_by_id(db, history_id)
    if not h or h.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="이력을 찾을 수 없습니다.")

    input_data = json.loads(h.input_payload)
    body = GenerateRequest(**input_data)

    from modules.generate.router import generate
    return await generate(body=body, db=db, current_user=current_user)