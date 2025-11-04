from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from .participant import ParticipantResponse


class TripStatus(str, Enum):
    planning = "planning"
    voting = "voting"
    confirmed = "confirmed"
    cancelled = "cancelled"


class TripCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)


class TripUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    status: Optional[TripStatus] = None


class TripResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    status: TripStatus
    created_by: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    participant_count: Optional[int] = 0

    class Config:
        from_attributes = True


class TripDetailResponse(TripResponse):
    participants: List[ParticipantResponse] = []

    class Config:
        from_attributes = True


class InviteRequest(BaseModel):
    emails: List[str] = Field(..., min_items=1)
    message: Optional[str] = None