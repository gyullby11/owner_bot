from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    amount     = Column(Integer, nullable=False)
    type       = Column(String(10), nullable=False)
    note       = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="transactions")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id                = Column(Integer, primary_key=True, autoincrement=True)
    user_id           = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                               nullable=False, index=True)
    plan              = Column(String(20), nullable=False)
    amount            = Column(Integer, nullable=False)
    status            = Column(String(20), nullable=False)
    period_start      = Column(Date, nullable=True)
    period_end        = Column(Date, nullable=True)
    pg_transaction_id = Column(String(100), nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="subscriptions")