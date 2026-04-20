from pydantic import BaseModel, field_validator
from typing import Optional
from typing import Literal


ALLOWED_TONES = {"friendly", "professional", "emotional"}


class GenerateRequest(BaseModel):
    shop_name: str
    business_type: str
    region: str
    keyword: str
    feature: Optional[str] = None
    tone: str = "friendly"

    @field_validator("shop_name", "business_type", "region", "keyword")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("필수 항목을 입력해주세요.")
        return v.strip()

    @field_validator("tone")
    @classmethod
    def tone_allowed(cls, v: str) -> str:
        if v not in ALLOWED_TONES:
            raise ValueError(f"tone은 {sorted(ALLOWED_TONES)} 중 하나여야 합니다.")
        return v


class GenerateResponse(BaseModel):
    message: str
    input: dict
    output: dict