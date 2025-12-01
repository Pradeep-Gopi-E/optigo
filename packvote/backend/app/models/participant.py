from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from ..utils.database import Base


class ParticipantRole(enum.Enum):
    owner = "owner"
    admin = "admin"
    member = "member"
    viewer = "viewer"


class ParticipantStatus(enum.Enum):
    invited = "invited"
    joined = "joined"
    declined = "declined"


class Participant(Base):
    __tablename__ = "participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(Enum(ParticipantRole), default=ParticipantRole.member)
    status = Column(Enum(ParticipantStatus), default=ParticipantStatus.invited)
    invited_at = Column(DateTime(timezone=True), server_default=func.now())
    joined_at = Column(DateTime(timezone=True), nullable=True)
    vote_status = Column(Enum("not_voted", "voted", "skipped", name="votestatus"), default="not_voted")

    # Relationships
    trip = relationship("Trip", back_populates="participants")
    user = relationship("User", back_populates="trip_participations")

    def __repr__(self):
        return f"<Participant(id={self.id}, trip_id={self.trip_id}, user_id={self.user_id}, role={self.role})>"