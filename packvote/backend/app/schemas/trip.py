from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum
from uuid import UUID

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
    expected_participants: Optional[int] = Field(None, ge=1, le=100)
    allow_member_recommendations: Optional[bool] = False
    image_url: Optional[str] = None


class TripUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    expected_participants: Optional[int] = Field(None, ge=1, le=100)
    status: Optional[TripStatus] = None
    allow_member_recommendations: Optional[bool] = None
    image_url: Optional[str] = None


class TripResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    expected_participants: Optional[int] = None
    invite_code: Optional[str] = None
    status: TripStatus
    allow_member_recommendations: bool
    created_by: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    image_url: Optional[str] = None
    itinerary: Optional[List[Dict[str, Any]]] = None
    destination_images: Optional[List[str]] = None

    class Config:
        from_attributes = True


class TripDetailResponse(TripResponse):
    participants: List[ParticipantResponse] = []


class InviteRequest(BaseModel):
    emails: List[str] = Field(..., min_items=1)
    message: Optional[str] = None


class JoinTripResponse(BaseModel):
    message: str
    trip_id: str
    trip_title: str