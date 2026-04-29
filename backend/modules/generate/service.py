import json
import re
from openai import AsyncOpenAI, RateLimitError, AuthenticationError, OpenAIError
from config import settings
from modules.generate.prompt_builder import build_prompt

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


def extract_json(raw: str) -> dict | None:
    """JSON 블록 추출 시도 — 마크다운 코드블록 제거 후 파싱"""
    # ```json ... ``` 또는 ``` ... ``` 제거
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    # { 로 시작하는 첫 번째 JSON 블록 추출 시도
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return None


async def generate_content(data: dict) -> dict:
    prompt = build_prompt(
        shop_name=data.get("shop_name", ""),
        business_type=data.get("business_type", ""),
        region=data.get("region", ""),
        keyword=data.get("keyword", ""),
        feature=data.get("feature", ""),
        tone=data.get("tone", "friendly")
    )

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=4000,
            timeout=30,
        )
    except RateLimitError:
        return {"error": "OpenAI 크레딧 부족 또는 요청 한도 초과"}
    except AuthenticationError:
        return {"error": "OpenAI API 키가 유효하지 않습니다"}
    except OpenAIError as e:
        return {"error": f"OpenAI 오류: {str(e)}"}

    raw = response.choices[0].message.content

    # 1차 시도 — 정상 파싱
    result = extract_json(raw)
    if result:
        return result

    # 2차 시도 — 재요청 (JSON만 달라고 명시)
    try:
        retry_response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": raw},
                {"role": "user", "content": "위 내용을 반드시 JSON 형식으로만 다시 출력해주세요. 다른 텍스트 없이 JSON만 출력하세요."}
            ],
            temperature=0.3,
            max_tokens=4000,
            timeout=30,
        )
    except OpenAIError:
        return {"error": "JSON 파싱 실패"}

    retry_raw = retry_response.choices[0].message.content
    result = extract_json(retry_raw)
    if result:
        return result

    return {"error": "JSON 파싱 실패"}

    import json
    from fastapi import HTTPException
    from sqlalchemy.orm import Session
    from modules.generate.models import GenerationHistory, GuestUsage
    from modules.generate.schemas import GenerateRequest
    from modules.history.models import CreditTransaction, CreditTransactionType
    from modules.user.models import User

    GUEST_FREE_LIMIT = 1


    def check_and_deduct_credit(db: Session, current_user: User, client_ip: str):
        """크레딧 차감 또는 비로그인 IP 체크"""
        if current_user:
            updated = db.query(User).filter(
                User.id == current_user.id,
                User.credits > 0
            ).update({"credits": User.credits - 1})
            db.flush()
            if updated == 0:
                raise HTTPException(status_code=402, detail="크레딧이 부족합니다. 충전 후 이용해 주세요.")
            db.refresh(current_user)
        else:
            guest_count = db.query(GuestUsage).filter(GuestUsage.ip_address == client_ip).count()
            if guest_count >= GUEST_FREE_LIMIT:
                raise HTTPException(status_code=403, detail="무료 체험은 1회만 가능합니다. 회원가입 후 이용해 주세요.")


    def save_generation_result(db: Session, body: GenerateRequest, output: dict, current_user: User, client_ip: str):
        """히스토리 저장 + 크레딧 트랜잭션 기록"""
        input_data = body.model_dump()
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
            db.refresh(history)
            return history
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="저장 중 오류가 발생했습니다.")