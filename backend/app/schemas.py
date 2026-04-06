from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    nickname: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GenerateRequest(BaseModel):
    shop_name: str
    business_type: str
    region: str
    keyword: str
    feature: Optional[str] = None
    tone: str = "friendly"