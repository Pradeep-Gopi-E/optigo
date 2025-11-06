from sqlalchemy import Column, String, DateTime, Text, Numeric, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from ..utils.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    destination_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    estimated_cost = Column(Numeric(10, 2), nullable=True)
    activities = Column(JSON, nullable=True)  # List of activities
    accommodation_options = Column(JSON, nullable=True)  # List of accommodation options
    transportation_options = Column(JSON, nullable=True)  # List of transportation options
    ai_generated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    trip = relationship("Trip", back_populates="recommendations")
    votes = relationship("Vote", back_populates="recommendation")

    def __repr__(self):
        return f"<Recommendation(id={self.id}, destination={self.destination_name}, ai_generated={self.ai_generated})>"