from pydantic import BaseModel
from typing import Optional


class GenerateRequest(BaseModel):
    shop_name: str
    business_type: str
    region: str
    keyword: str
    feature: Optional[str] = None
    tone: str = "friendly"


class GenerateResponse(BaseModel):
    message: str
    input: dict
    output: dict