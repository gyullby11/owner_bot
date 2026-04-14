import json
import re
from openai import AsyncOpenAI
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


async def stream_content(data: dict) -> dict:
    prompt = build_prompt(
        shop_name=data["shop_name"],
        business_type=data["business_type"],
        region=data["region"],
        keyword=data["keyword"],
        feature=data.get("feature", ""),
        tone=data.get("tone", "friendly")
    )

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        max_tokens=2000,
    )

    raw = response.choices[0].message.content

    # 1차 시도 — 정상 파싱
    result = extract_json(raw)
    if result:
        return result

    # 2차 시도 — 재요청 (JSON만 달라고 명시)
    retry_response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": raw},
            {"role": "user", "content": "위 내용을 반드시 JSON 형식으로만 다시 출력해주세요. 다른 텍스트 없이 JSON만 출력하세요."}
        ],
        temperature=0.3,
        max_tokens=2000,
    )

    retry_raw = retry_response.choices[0].message.content
    result = extract_json(retry_raw)
    if result:
        return result

    return {"error": "JSON 파싱 실패"}