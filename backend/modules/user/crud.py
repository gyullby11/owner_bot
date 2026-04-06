from sqlalchemy.orm import Session
from modules.user.models import User


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, email: str, hashed_password: str, nickname: str = None):
    user = User(
        email=email,
        hashed_password=hashed_password,
        nickname=nickname,
        credits=3,
        plan="free"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user