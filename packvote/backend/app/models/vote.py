from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from ..utils.database import Base


class Vote(Base):
    __tablename__ = "votes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    recommendation_id = Column(UUID(as_uuid=True), ForeignKey("recommendations.id"), nullable=False)
    rank = Column(Integer, nullable=False)  # 1=first choice, 2=second choice, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    trip = relationship("Trip", back_populates="votes")
    user = relationship("User", back_populates="votes")
    recommendation = relationship("Recommendation", back_populates="votes")

    # Constraints
    __table_args__ = (
        UniqueConstraint('trip_id', 'user_id', 'recommendation_id', name='unique_user_trip_recommendation_vote'),
    )

    def __repr__(self):
        return f"<Vote(id={self.id}, user_id={self.user_id}, recommendation_id={self.recommendation_id}, rank={self.rank})>"