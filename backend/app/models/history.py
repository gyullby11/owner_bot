from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class GenerationHistory(Base):
    __tablename__ = "generation_history"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    user_id        = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"),
                            nullable=True, index=True)   # NULL = 비로그인 체험
    shop_name      = Column(String(100), nullable=False)
    business_type  = Column(String(50),  nullable=False)
    region         = Column(String(100), nullable=False)
    keyword        = Column(String(100), nullable=False)
    feature        = Column(String(200), nullable=True)
    tone           = Column(String(20),  nullable=False, default="friendly")
    input_payload  = Column(Text, nullable=False)
    output_payload = Column(Text, nullable=False)
    credits_used   = Column(Integer, nullable=False, default=1)
    created_at     = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="histories")