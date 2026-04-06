from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from modules.user.schemas import UserRegister, UserLogin
from modules.user import crud, service

router = APIRouter()


@router.post("/signup")
def signup(user: UserRegister, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")

    hashed = service.hash_password(user.password)
    new_user = crud.create_user(db, user.email, hashed, user.nickname)

    return {
        "message": "회원가입 성공",
        "email": new_user.email,
        "nickname": new_user.nickname,
        "credits": new_user.credits
    }


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)

    if not db_user:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    if not service.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="비활성화된 계정입니다.")

    return {
        "message": "로그인 성공",
        "email": db_user.email,
        "nickname": db_user.nickname,
        "credits": db_user.credits,
        "plan": db_user.plan
    }