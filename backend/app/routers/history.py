from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def history_test():
    return {"message": "history router working"}