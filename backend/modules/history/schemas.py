from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HistoryResponse(BaseModel):
    id: int
    shop_name: str
    keyword: str
    region: str
    tone: str
    created_at: Optional[datetime]
    output: dict

    class Config:
        from_attributes = True