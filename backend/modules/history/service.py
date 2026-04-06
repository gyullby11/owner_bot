import json
from modules.generate.models import GenerationHistory


def format_history(history: GenerationHistory) -> dict:
    return {
        "id": history.id,
        "shop_name": history.shop_name,
        "keyword": history.keyword,
        "region": history.region,
        "tone": history.tone,
        "created_at": str(history.created_at),
        "output": json.loads(history.output_payload)
    }