from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class ParticipantRole(str, Enum):
    owner = "owner"
    member = "member"
    viewer = "viewer"


class ParticipantStatus(str, Enum):
    invited = "invited"
    joined = "joined"
    declined = "declined"


class ParticipantResponse(BaseModel):
    id: str
    trip_id: str
    user_id: str
    role: ParticipantRole
    status: ParticipantStatus
    invited_at: Optional[datetime] = None
    joined_at: Optional[datetime] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    vote_status: Optional[str] = "not_voted"

    class Config:
        from_attributes = True