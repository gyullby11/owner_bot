from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def mypage_test():
    return {"message": "mypage router working"}