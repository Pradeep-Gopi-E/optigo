from sqlalchemy import Column, String, DateTime, Text, Numeric, Enum, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from ..utils.database import Base


class TripStatus(enum.Enum):
    planning = "planning"
    voting = "voting"
    confirmed = "confirmed"
    cancelled = "cancelled"


class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    destination = Column(String(255), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    budget_min = Column(Numeric(10, 2), nullable=True)
    budget_max = Column(Numeric(10, 2), nullable=True)
    expected_participants = Column(Integer, nullable=True)
    invite_code = Column(String(20), unique=True, nullable=True, index=True)
    status = Column(Enum(TripStatus), default=TripStatus.planning, nullable=False)
    allow_member_recommendations = Column(Boolean, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    created_by_user = relationship("User", back_populates="created_trips")
    participants = relationship("Participant", back_populates="trip", cascade="all, delete-orphan")
    preferences = relationship("Preference", back_populates="trip", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="trip", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="trip", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Trip(id={self.id}, title={self.title}, status={self.status})>"