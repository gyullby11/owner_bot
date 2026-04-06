from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.history import GenerationHistory

router = APIRouter()


@router.get("/")
def get_mypage(db: Session = Depends(get_db)):
    # 임시: 첫 번째 유저 기준 (추후 JWT 인증 연결 시 수정)
    user = db.query(User).first()
    if not user:
        return {"message": "유저 없음"}

    history_count = db.query(GenerationHistory)\
                      .filter(GenerationHistory.user_id == user.id)\
                      .count()

    return {
        "email": user.email,
        "nickname": user.nickname,
        "credits": user.credits,
        "plan": user.plan,
        "history_count": history_count
    }