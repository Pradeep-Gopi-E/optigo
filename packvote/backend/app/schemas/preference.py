from typing import List, Dict, Optional, Any
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field

class PreferenceType(str, Enum):
    BUDGET = "budget"
    DATES = "dates"
    ACTIVITIES = "activities"
    ACCOMMODATION = "accommodation"
    TRANSPORTATION = "transportation"
    VIBE = "vibe"
    DETAILED = "detailed"

class PreferenceCreate(BaseModel):
    preference_type: PreferenceType
    preference_data: Dict[str, Any]

class PreferenceUpdate(BaseModel):
    preference_data: Optional[Dict[str, Any]] = None

class PreferenceResponse(BaseModel):
    id: str
    trip_id: str
    user_id: str
    preference_type: str
    preference_data: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_name: Optional[str] = None

class SurveyResponse(BaseModel):
    trip_id: str
    user_preferences: List[PreferenceResponse]
    completion_status: Dict[str, bool]
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

class DetailedPreference(BaseModel):
    accommodation_type: Optional[str] = None
    accommodation_amenities: List[str] = Field(default_factory=list)
    transportation_preference: Optional[str] = None
    activity_level: Optional[str] = None
    must_have_activities: List[str] = Field(default_factory=list)
    avoid_activities: List[str] = Field(default_factory=list)
    dietary_restrictions: List[str] = Field(default_factory=list)
    group_size_preference: Optional[str] = None
    budget_sensitivity: Optional[str] = None
    trip_description: Optional[str] = None

class CompleteSurveyRequest(BaseModel):
    budget: Optional[BudgetPreference] = None
    dates: Optional[DatesPreference] = None
    activities: Optional[ActivitiesPreference] = None
    accommodation: Optional[AccommodationPreference] = None
    transportation: Optional[TransportationPreference] = None
    vibe: Optional[VibePreference] = None
    detailed: Optional[DetailedPreference] = None