from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.history import GenerationHistory
import json

router = APIRouter()


@router.get("/")
def get_history(db: Session = Depends(get_db)):
    histories = db.query(GenerationHistory)\
                  .order_by(GenerationHistory.created_at.desc())\
                  .limit(50)\
                  .all()

    return [
        {
            "id": h.id,
            "shop_name": h.shop_name,
            "keyword": h.keyword,
            "region": h.region,
            "tone": h.tone,
            "created_at": str(h.created_at),
            "output": json.loads(h.output_payload)
        }
        for h in histories
    ]


@router.delete("/{history_id}")
def delete_history(history_id: int, db: Session = Depends(get_db)):
    history = db.query(GenerationHistory).filter(GenerationHistory.id == history_id).first()
    if not history:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="히스토리를 찾을 수 없습니다.")
    db.delete(history)
    db.commit()
    return {"message": "삭제 완료"}