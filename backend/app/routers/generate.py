from fastapi import APIRouter
from app.schemas import GenerateRequest   # ✅ 여기 넣는 거
from app.services.openai_service import generate_content

router = APIRouter()


@router.post("/")
def generate(request: GenerateRequest):
    result = generate_content(request.dict())

    return {
        "message": "콘텐츠 생성 성공",
        "input": request.dict(),
        "output": result
    }