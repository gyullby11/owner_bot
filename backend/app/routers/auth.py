from fastapi import APIRouter
from app.schemas import UserRegister, UserLogin

router = APIRouter()


@router.post("/signup")
def signup(user: UserRegister):
    return {
        "message": "회원가입 테스트 성공",
        "email": user.email,
        "nickname": user.nickname
    }


@router.post("/login")
def login(user: UserLogin):
    return {
        "message": "로그인 테스트 성공",
        "email": user.email
    }