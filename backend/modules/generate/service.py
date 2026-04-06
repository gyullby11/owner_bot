import json
from openai import OpenAI
from config import settings
from modules.generate.prompt_builder import build_prompt

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def generate_content(data: dict) -> dict:
    prompt = build_prompt(
        shop_name=data["shop_name"],
        business_type=data["business_type"],
        region=data["region"],
        keyword=data["keyword"],
        feature=data.get("feature", ""),
        tone=data.get("tone", "friendly")
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000,
        temperature=0.8,
    )

    raw = response.choices[0].message.content

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"raw": raw, "error": "JSON 파싱 실패 — 원본 반환"}