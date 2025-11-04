from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class PreferenceType(str, Enum):
    budget = "budget"
    dates = "dates"
    activities = "activities"
    accommodation = "accommodation"
    transportation = "transportation"
    vibe = "vibe"


class PreferenceCreate(BaseModel):
    preference_type: PreferenceType
    preference_data: Dict[str, Any] = Field(..., description="JSON data containing the preference details")


class PreferenceUpdate(BaseModel):
    preference_data: Optional[Dict[str, Any]] = Field(None, description="Updated JSON preference data")


class PreferenceResponse(BaseModel):
    id: str
    trip_id: str
    user_id: str
    preference_type: PreferenceType
    preference_data: Dict[str, Any]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


class SurveyResponse(BaseModel):
    trip_id: str
    user_preferences: List[PreferenceResponse]
    completion_status: Dict[str, bool]  # preference_type -> completed
    overall_complete: bool


class BudgetPreference(BaseModel):
    min_budget: Optional[float] = Field(None, ge=0)
    max_budget: Optional[float] = Field(None, ge=0)
    currency: str = Field(default="USD", max_length=3)
    per_person: bool = True


class DatesPreference(BaseModel):
    available_dates: List[str] = Field(..., description="List of available date ranges in ISO format")
    flexible_dates: bool = True
    preferred_duration_min: Optional[int] = Field(None, ge=1, description="Minimum trip duration in days")
    preferred_duration_max: Optional[int] = Field(None, ge=1, description="Maximum trip duration in days")


class ActivitiesPreference(BaseModel):
    preferred_activities: List[str] = Field(..., description="List of preferred activities")
    activity_level: str = Field("moderate", enum=["relaxed", "moderate", "active", "extreme"])
    must_have_activities: List[str] = Field(default_factory=list, description="Activities that must be included")
    avoid_activities: List[str] = Field(default_factory=list, description="Activities to avoid")


class AccommodationPreference(BaseModel):
    preferred_types: List[str] = Field(..., enum=["hotel", "airbnb", "hostel", "resort", "vacation_rental"])
    room_preference: str = Field("any", enum=["private", "shared", "any"])
    amenities: List[str] = Field(default_factory=list, description="Required amenities")
    budget_importance: str = Field("medium", enum=["low", "medium", "high"])


class TransportationPreference(BaseModel):
    preferred_modes: List[str] = Field(..., enum=["flight", "train", "car", "bus", "boat"])
    travel_time_importance: str = Field("medium", enum=["low", "medium", "high"])
    comfort_level: str = Field("medium", enum=["basic", "medium", "premium"])
    environmental_impact: str = Field("medium", enum=["low", "medium", "high"])


class VibePreference(BaseModel):
    trip_vibe: List[str] = Field(..., enum=["adventure", "relaxation", "culture", "nightlife", "nature", "foodie", "shopping", "photography"])
    group_size_preference: str = Field("flexible", enum=["small", "medium", "large", "flexible"])
    planning_style: str = Field("balanced", enum=["spontaneous", "balanced", "structured"])
    social_atmosphere: str = Field("moderate", enum=["quiet", "moderate", "social", "party"])


class CompleteSurveyRequest(BaseModel):
    budget: Optional[BudgetPreference] = None
    dates: Optional[DatesPreference] = None
    activities: Optional[ActivitiesPreference] = None
    accommodation: Optional[AccommodationPreference] = None
    transportation: Optional[TransportationPreference] = None
    vibe: Optional[VibePreference] = None