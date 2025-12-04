from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class RecommendationCreate(BaseModel):
    destination_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    estimated_cost: Optional[float] = Field(None, ge=0)
    activities: Optional[List[str]] = Field(default_factory=list)
    accommodation_options: Optional[List[str]] = Field(default_factory=list)
    transportation_options: Optional[List[str]] = Field(default_factory=list)
    ai_generated: bool = False


class RecommendationUpdate(BaseModel):
    destination_name: Optional[str] = None
    description: Optional[str] = None
    estimated_cost: Optional[float] = None
    activities: Optional[List[str]] = None
    accommodation_options: Optional[List[str]] = None
    transportation_options: Optional[List[str]] = None
    meta: Optional[dict] = None


class RecommendationResponse(BaseModel):
    id: str
    trip_id: str
    destination_name: str
    description: Optional[str] = None
    estimated_cost: Optional[float] = None
    activities: Optional[List[str]] = None
    accommodation_options: Optional[List[str]] = None
    transportation_options: Optional[List[str]] = None
    ai_generated: bool
    created_at: Optional[datetime] = None
    image_url: Optional[str] = None
    weather_info: Optional[str] = None
    meta: Optional[dict] = None
    personalization: Optional[dict] = None

    class Config:
        from_attributes = True

class GenerateRecommendationsResponse(BaseModel):
    message: str
    recommendations_generated: int
    ai_service_available: bool