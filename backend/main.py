import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from api.router import api_router

from modules.user.models import User
from modules.generate.models import GenerationHistory
from modules.history.models import CreditTransaction, Subscription

app = FastAPI(
    title="사장봇 API",
    description="소상공인 AI 마케팅 콘텐츠 자동 생성 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)

app.include_router(api_router, prefix="/api")
app.mount("/frontend", StaticFiles(directory="../frontend"), name="frontend")


@app.get("/")
def root():
    return {"message": "사장봇 API 서버 정상 작동 중"}

@app.get("/health")
def health():
    return {"status": "ok"}

app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")