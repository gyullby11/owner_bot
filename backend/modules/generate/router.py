from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from modules.generate.schemas import GenerateRequest
from modules.generate import service
from modules.user.models import User
from modules.user import service as user_service

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
    sub = payload.get("sub")
    if not sub:
        return None
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
    client_ip = request.client.host if request.client else "unknown"

    # 크레딧 차감 또는 비로그인 IP 체크
    service.check_and_deduct_credit(db, current_user, client_ip)

    # 콘텐츠 생성
    input_data = body.model_dump()
    output = await service.generate_content(input_data)

    if "error" in output or "blog" not in output:
        db.rollback()
        raise HTTPException(status_code=500, detail="콘텐츠 생성 중 오류가 발생했습니다. 다시 시도해 주세요.")

    # 히스토리 저장
    history = service.save_generation_result(db, body, output, current_user, client_ip)

    return {
        "message": "콘텐츠 생성 성공",
        "input": input_data,
        "output": output,
        "history_id": history.id,
        "credits_remaining": current_user.credits if current_user else None,
    }