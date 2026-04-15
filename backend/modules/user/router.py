from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import ExpiredSignatureError, JWTError
from jose import jwt as jose_jwt
from sqlalchemy.orm import Session

from database import get_db
from modules.user.schemas import UserRegister, Token, UserOut, PasswordChange
from modules.user.models import User
from modules.history.models import CreditTransaction, CreditTransactionType
from modules.user import crud, service
from config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# JWT 현재 유저 추출 (의존성)
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    
    try:
        payload = jose_jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다. 다시 로그인해 주세요.")
    except JWTError:
        raise HTTPException(status_code=401, detail="토큰이 유효하지 않습니다.")

    user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")
    return user


# 회원가입
@router.post("/signup", response_model=UserOut, status_code=201)
def signup(body: UserRegister, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")
    if body.nickname and crud.get_user_by_nickname(db, body.nickname):
        raise HTTPException(status_code=409, detail="이미 사용 중인 닉네임입니다.")

    hashed = service.hash_password(body.password)
    try:
        user = crud.create_user(db, body.email, hashed, body.nickname)
        service.create_user_with_bonus(db, user)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="회원가입 처리 중 오류가 발생했습니다.")
    return user

# 로그인
# Swagger Authorize 창과 맞추기 위해 form-data(username, password) 방식 사용
@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀립니다.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="비활성화된 계정입니다.")

    token = service.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


# 내 정보 조회
@router.get("/me", response_model=UserOut)
def me(
    current_user: User = Depends(get_current_user)
):
    return current_user


# 비밀번호 변경
@router.put("/password", status_code=200)
def change_password(
    body: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not service.verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")
    if body.current_password == body.new_password:
        raise HTTPException(status_code=400, detail="새 비밀번호가 현재 비밀번호와 동일합니다.")

    current_user.hashed_password = service.hash_password(body.new_password)
    db.commit()
    return {"message": "비밀번호가 변경되었습니다."}
