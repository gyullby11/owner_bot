from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from modules.history import crud, service

router = APIRouter()


@router.get("/")
def get_history(db: Session = Depends(get_db)):
    histories = crud.get_history_list(db)
    return [service.format_history(h) for h in histories]


@router.delete("/{history_id}")
def delete_history(history_id: int, db: Session = Depends(get_db)):
    history = crud.delete_history(db, history_id)
    if not history:
        raise HTTPException(status_code=404, detail="히스토리를 찾을 수 없습니다.")
    return {"message": "삭제 완료"}