from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

# This 'Base' is likely imported from a shared database setup file.
# Assuming it's in a file like 'app/utils/database.py' as per your import.
from ..utils.database import Base


class PreferenceType(enum.Enum):
    budget = "budget"
    dates = "dates"
    activities = "activities"
    accommodation = "accommodation"
    transportation = "transportation"
    vibe = "vibe"


class Preference(Base):
    __tablename__ = "preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Corrected line: Use the 'Enum' imported from 'sqlalchemy'
    preference_type = Column(Enum(PreferenceType), nullable=False)
    
    preference_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    trip = relationship("Trip", back_populates="preferences")
    user = relationship("User", back_populates="preferences")

    def __repr__(self):
        return f"<Preference(id={self.id}, type={self.preference_type}, user_id={self.user_id})>"