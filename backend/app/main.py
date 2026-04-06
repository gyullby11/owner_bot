from fastapi import FastAPI
from app.database import Base, engine

# ✅ models import (테이블 생성 위해 반드시 필요)
import app.models

# ✅ routers import
from app.routers import auth, generate, history, mypage

app = FastAPI(
    title="사장봇 API",
    description="소상공인 AI 마케팅 콘텐츠 자동 생성 API",
    version="1.0.0"
)

# ✅ 서버 시작 시 DB 테이블 생성
@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)

# ✅ 라우터 연결
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(generate.router, prefix="/api/generate", tags=["generate"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(mypage.router, prefix="/api/mypage", tags=["mypage"])

# ✅ 기본 테스트
@app.get("/")
def root():
    return {"message": "사장봇 API 서버 정상 작동 중"}

# ✅ 헬스체크 (서버 살아있는지 확인용)
@app.get("/health")
def health():
    return {"status": "ok"}