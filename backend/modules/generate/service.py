import json
from openai import AsyncOpenAI
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

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        max_tokens=2000,
    )

    raw = response.choices[0].message.content

    try:
        result = json.loads(raw)
        return result
    except json.JSONDecodeError:
        return {"raw": raw, "error": "JSON 파싱 실패"}