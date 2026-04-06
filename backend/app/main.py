from fastapi import FastAPI
from app.database import Base, engine

app = FastAPI(title="사장봇 API")

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "사장봇 API 서버 정상 작동 중"}