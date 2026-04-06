from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserRegister, UserLogin
from app.models.user import User
from app.services.auth_service import hash_password, verify_password

router = APIRouter()


@router.post("/signup")
def signup(user: UserRegister, db: Session = Depends(get_db)):
    # 이메일 중복 체크
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")

    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password),
        nickname=user.nickname,
        credits=3,
        plan="free"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "회원가입 성공",
        "email": new_user.email,
        "nickname": new_user.nickname,
        "credits": new_user.credits
    }


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    if not verify_password(user.password, db_user.hashed_password):
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