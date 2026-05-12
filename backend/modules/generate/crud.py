import json
from sqlalchemy.orm import Session
from modules.generate.models import GenerationHistory


def save_history(db: Session, data: dict, output: dict, user_id: int = None):
    history = GenerationHistory(
        user_id=user_id,
        shop_name=data["shop_name"],
        business_type=data["business_type"],
        region=data["region"],
        keyword=data["keyword"],
        feature=data.get("feature"),
        tone=data.get("tone", "friendly"),
        input_payload=json.dumps(data, ensure_ascii=False),
        output_payload=json.dumps(output, ensure_ascii=False),
        credits_used=1
    )
    db.add(history)
    db.flush()
    db.refresh(history)
    return history