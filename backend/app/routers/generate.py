import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import GenerateRequest
from app.services.openai_service import generate_content
from app.models.history import GenerationHistory

router = APIRouter()


@router.post("/")
def generate(request: GenerateRequest, db: Session = Depends(get_db)):
    input_data = request.dict()
    output = generate_content(input_data)

    # 히스토리 저장
    history = GenerationHistory(
        user_id=None,  # 추후 JWT 인증 연결 시 user_id 넣기
        shop_name=request.shop_name,
        business_type=request.business_type,
        region=request.region,
        keyword=request.keyword,
        feature=request.feature,
        tone=request.tone,
        input_payload=json.dumps(input_data, ensure_ascii=False),
        output_payload=json.dumps(output, ensure_ascii=False),
        credits_used=1
    )
    db.add(history)
    db.commit()

    return {
        "message": "콘텐츠 생성 성공",
        "input": input_data,
        "output": output
    }