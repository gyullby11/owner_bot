from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from modules.generate.schemas import GenerateRequest
from modules.generate import crud, service

router = APIRouter()


@router.post("/")
def generate(request: GenerateRequest, db: Session = Depends(get_db)):
    input_data = request.dict()
    output = service.generate_content(input_data)
    crud.save_history(db, input_data, output)

    return {
        "message": "콘텐츠 생성 성공",
        "input": input_data,
        "output": output
    }