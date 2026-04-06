from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    amount     = Column(Integer, nullable=False)          # 양수: 획득 / 음수: 차감
    type       = Column(String(10), nullable=False)       # earn / use / refund
    note       = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="transactions")