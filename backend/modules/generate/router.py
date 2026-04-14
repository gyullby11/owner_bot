import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from modules.generate.schemas import GenerateRequest
from modules.generate.models import GenerationHistory
from modules.generate import service, crud
from modules.history.models import CreditTransaction, CreditTransactionType
from modules.user.models import User
from modules.user.router import get_current_user
from modules.user import service as user_service
from modules.history.models import CreditTransaction

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_optional_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """토큰이 있으면 User 반환, 없으면 None 반환 (비로그인 허용)"""
    if not token:
        return None
    payload = user_service.decode_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == int(payload.get("sub"))).first()


@router.post("", response_model=None)
async def generate(
    body: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.credits is None:
        current_user.credits = 0

    if current_user.credits <= 0:
        raise HTTPException(
            status_code=400,
            detail="크레딧이 부족합니다. 마이페이지에서 크레딧을 확인해주세요.",
        )

    input_data = body.model_dump()
    full_output = {}
    async for chunk_type, chunk_text in service.stream_content(input_data):
        full_output.setdefault(chunk_type, "")
        full_output[chunk_type] += chunk_text

    current_user.credits -= 1

    credit_tx = CreditTransaction(
        user_id=current_user.id,
        amount=1,
        type="use",
        note="콘텐츠 생성 1회 사용",
    )
    db.add(credit_tx)

    history = GenerationHistory(
        user_id=current_user.id,
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

    # 로그인 사용자 크레딧 차감 및 거래 기록
    if current_user:
        current_user.credits -= 1
        db.add(CreditTransaction(
            user_id=current_user.id,
            amount=-1,
            type=CreditTransactionType.use,
            note="콘텐츠 생성",
        ))

    db.commit()
    db.refresh(history)
    db.refresh(current_user)

    return {
        "message": "콘텐츠 생성 성공",
        "input": input_data,
        "output": full_output,
        "remaining_credits": current_user.credits,
        "history_id": history.id,
    }
