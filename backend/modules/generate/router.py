import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from modules.generate.schemas import GenerateRequest
from modules.generate.models import GenerationHistory
from modules.generate import service, crud

router = APIRouter()


@router.post("", response_model=None)
async def generate(
    body: GenerateRequest,
    db: Session = Depends(get_db),
):
    input_data = body.model_dump()
    output = await service.stream_content(input_data)

    history = GenerationHistory(
        user_id=None,
        shop_name=body.shop_name,
        business_type=body.business_type,
        region=body.region,
        keyword=body.keyword,
        feature=body.feature,
        tone=body.tone,
        input_payload=json.dumps(input_data, ensure_ascii=False),
        output_payload=json.dumps(output, ensure_ascii=False),
        credits_used=1,
    )
    db.add(history)
    db.commit()

    return {
        "message": "콘텐츠 생성 성공",
        "input": input_data,
        "output": output
    }