from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from modules.history.models import CreditTransaction
from modules.user.models import User
from modules.user.router import get_current_user

router = APIRouter()


@router.get("/me")
def my_info(current_user: User = Depends(get_current_user)):
    """마이페이지 기본 정보 — 닉네임·이메일·크레딧·플랜"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "nickname": current_user.nickname,
        "credits": current_user.credits,
        "plan": current_user.plan,
    }


@router.get("/credits")
def credits_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """크레딧 잔액 및 최근 거래 내역 20건"""
    transactions = (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == current_user.id)
        .order_by(CreditTransaction.created_at.desc())
        .limit(20)
        .all()
    )
    return {
        "credits": current_user.credits,
        "plan": current_user.plan,
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.type,
                "note": t.note,
                "created_at": t.created_at,
            }
            for t in transactions
        ],
    }