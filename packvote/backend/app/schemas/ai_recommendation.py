from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any

class AIRecommendation(BaseModel):
    destination: str = Field(..., description="City, Country")
    description: str = Field(..., description="2-3 sentences why perfect for THIS group")
    estimated_cost_per_person: str = Field(..., description="Estimated cost string, e.g. '$1,200'")
    highlights: List[str] = Field(..., description="Top 5 specific attractions")
    best_for: str = Field(..., description="Target audience type")
    weather_info: str = Field(..., description="Expected weather during travel dates")
    activities: List[str] = Field(..., description="List of activities")
    accommodation_options: List[str] = Field(..., description="Specific hotel/area options")
    transportation_notes: str = Field(..., description="How to get there and around")
    match_reason: str = Field(..., description="Why this matches the group's preferences")
    continent: str = Field(..., description="Continent of the destination")
    experience_type: str = Field(..., description="Type of experience (beach, mountain, city, etc.)")
    cost_breakdown: Dict[str, str] = Field(..., description="Estimated cost per person for each participant location")
    itinerary: List[Dict[str, Any]] = Field(default_factory=list, description="Day-by-day itinerary")
    dining_recommendations: List[Dict[str, Any]] = Field(default_factory=list, description="Dining recommendations")

    @model_validator(mode='before')
    @classmethod
    def map_location_to_destination(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if 'location' in data and 'destination' not in data:
                data['destination'] = data['location']
        return data

class AIResponse(BaseModel):
    recommendations: List[AIRecommendation]
