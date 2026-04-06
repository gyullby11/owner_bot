from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id                = Column(Integer, primary_key=True, autoincrement=True)
    user_id           = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                               nullable=False, index=True)
    plan              = Column(String(20), nullable=False)   # monthly / per-use
    amount            = Column(Integer,   nullable=False)    # 결제금액 (원)
    status            = Column(String(20), nullable=False)   # paid / failed / refunded
    period_start      = Column(Date, nullable=True)
    period_end        = Column(Date, nullable=True)
    pg_transaction_id = Column(String(100), nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="subscriptions")