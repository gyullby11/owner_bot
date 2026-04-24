import json

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from modules.generate.schemas import GenerateRequest
from modules.generate.models import GenerationHistory, GuestUsage
from modules.generate import service
from modules.history.models import CreditTransaction, CreditTransactionType
from modules.user.models import User
from modules.user.router import get_current_user
from modules.user import service as user_service

GUEST_FREE_LIMIT = 1  # 비로그인 무료 체험 횟수

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
    # ✅ 피드백 4: int(sub) 변환 실패 가능성 → try/except 처리
    try:
        user_id = int(sub)
    except (ValueError, TypeError):
        return None
    return db.query(User).filter(User.id == user_id).first()


@router.post("", response_model=None)
async def generate(
    request: Request,
    body: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user),
):
    if current_user:
        # atomic update: credits > 0 인 경우에만 차감 (race condition 방지)
        updated = db.query(User).filter(
            User.id == current_user.id,
            User.credits > 0
        ).update({"credits": User.credits - 1})
        db.flush()
        if updated == 0:
            raise HTTPException(status_code=402, detail="크레딧이 부족합니다. 충전 후 이용해 주세요.")
        db.refresh(current_user)
    else:
        # 비로그인 IP 제한
        client_ip = request.client.host if request.client else "unknown"
        guest_count = db.query(GuestUsage).filter(GuestUsage.ip_address == client_ip).count()
        if guest_count >= GUEST_FREE_LIMIT:
            raise HTTPException(status_code=403, detail="무료 체험은 1회만 가능합니다. 회원가입 후 이용해 주세요.")

    input_data = body.model_dump()
    output = await service.generate_content(input_data)

    if "error" in output or "blog" not in output:
        db.rollback()  # 차감된 크레딧 복구
        raise HTTPException(status_code=500, detail="콘텐츠 생성 중 오류가 발생했습니다. 다시 시도해 주세요.")

    history = GenerationHistory(
        user_id=current_user.id if current_user else None,
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
    try:
        db.add(history)
        if current_user:
            db.add(CreditTransaction(
                user_id=current_user.id,
                amount=-1,
                type=CreditTransactionType.use,
                note="콘텐츠 생성",
            ))
        else:
            db.add(GuestUsage(ip_address=client_ip))
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="저장 중 오류가 발생했습니다.")

    return {
        "message": "콘텐츠 생성 성공",
        "input": input_data,
        "output": output,
        "credits_remaining": current_user.credits if current_user else None,
    }