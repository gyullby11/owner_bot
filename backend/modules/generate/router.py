import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from modules.generate.schemas import GenerateRequest
from modules.generate.models import GenerationHistory
from modules.history.models import CreditTransaction
from modules.user.models import User
from modules.user.router import get_current_user
from modules.generate import service, crud

router = APIRouter()


@router.post("")
async def generate(
    body: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = None,
):
    input_data = body.model_dump()

    async def event_stream():
        full_output = {}
        async for chunk_type, chunk_text in service.stream_content(input_data):
            full_output.setdefault(chunk_type, "")
            full_output[chunk_type] += chunk_text
            yield f"data: {json.dumps({'type': chunk_type, 'text': chunk_text}, ensure_ascii=False)}\n\n"

        # 생성 완료 후 DB 저장
        history = GenerationHistory(
            user_id=current_user.id if current_user else None,
            shop_name=body.shop_name,
            business_type=body.business_type,
            region=body.region,
            keyword=body.keyword,
            feature=body.feature,
            tone=body.tone,
            input_payload=json.dumps(input_data, ensure_ascii=False),
            output_payload=json.dumps(full_output, ensure_ascii=False),
            credits_used=1,
        )
        db.add(history)

        # 로그인 유저 크레딧 차감
        if current_user:
            if current_user.credits <= 0:
                raise HTTPException(status_code=402, detail="크레딧이 부족합니다.")
            current_user.credits -= 1
            db.add(CreditTransaction(
                user_id=current_user.id,
                amount=-1,
                type="use",
                note=f"{body.shop_name} 콘텐츠 생성",
            ))

        db.commit()
        yield f"data: {json.dumps({'type': 'done', 'history_id': history.id}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")