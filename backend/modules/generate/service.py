import json
from openai import AsyncOpenAI, RateLimitError, AuthenticationError, OpenAIError
from config import settings
from modules.generate.prompt_builder import build_prompt

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def stream_content(data: dict) -> dict:
    prompt = build_prompt(
        shop_name=data["shop_name"],
        business_type=data["business_type"],
        region=data["region"],
        keyword=data["keyword"],
        feature=data.get("feature", ""),
        tone=data.get("tone", "friendly")
    )

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=2000,
        )
    except RateLimitError:
        return {"error": "OpenAI 크레딧 부족 또는 요청 한도 초과"}
    except AuthenticationError:
        return {"error": "OpenAI API 키가 유효하지 않습니다"}
    except OpenAIError as e:
        return {"error": f"OpenAI 오류: {str(e)}"}

    raw = response.choices[0].message.content

    try:
        result = json.loads(raw)
        return result
    except json.JSONDecodeError:
        return {"raw": raw, "error": "JSON 파싱 실패"}