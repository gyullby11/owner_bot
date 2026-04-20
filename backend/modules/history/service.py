import json
from modules.generate.models import GenerationHistory


def format_history(history: GenerationHistory) -> dict:
    """히스토리 객체를 dict로 변환 — 향후 router에서 활용 예정"""
    return {
        "id": history.id,
        "shop_name": history.shop_name,
        "business_type": history.business_type,
        "keyword": history.keyword,
        "region": history.region,
        "feature": history.feature,
        "tone": history.tone,
        "credits_used": history.credits_used,
        "created_at": str(history.created_at),
        "output_payload": json.loads(history.output_payload)
    }