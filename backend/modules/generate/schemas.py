from pydantic import BaseModel, field_validator
from typing import Optional


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


class GenerateResponse(BaseModel):
    message: str
    input: dict
    output: dict