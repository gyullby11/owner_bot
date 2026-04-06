from fastapi import FastAPI
from database import Base, engine
from api.router import api_router

# 모델 임포트 (테이블 생성 위해 필수)
from modules.user.models import User
from modules.generate.models import GenerationHistory
from modules.history.models import CreditTransaction, Subscription

app = FastAPI(
    title="사장봇 API",
    description="소상공인 AI 마케팅 콘텐츠 자동 생성 API",
    version="1.0.0"
)

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)

# 라우터 통합 연결
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "사장봇 API 서버 정상 작동 중"}

@app.get("/health")
def health():
    return {"status": "ok"}