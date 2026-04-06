from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    nickname        = Column(String(100), nullable=True)
    credits         = Column(Integer, nullable=False, default=3)
    plan            = Column(String(20), nullable=False, default="free")
    is_active       = Column(Boolean, nullable=False, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    histories     = relationship("GenerationHistory", back_populates="user",
                                 cascade="all, delete-orphan")
    transactions  = relationship("CreditTransaction", back_populates="user",
                                 cascade="all, delete-orphan")