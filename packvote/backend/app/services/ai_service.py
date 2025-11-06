import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from ..models import Preference, Recommendation, Trip, User
from ..config import settings
from ..schemas.preference import PreferenceType

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered destination recommendations using Gemini"""

    def __init__(self, db: Session):
        self.db = db
        self._initialize_gemini()

    def _initialize_gemini(self):
        """Initialize Gemini AI client"""
        try:
            if settings.GOOGLE_AI_API_KEY:
                genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
                self.model = genai.GenerativeModel(
                    model_name=settings.GEMINI_MODEL,
                    safety_settings={
                        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    }
                )
                logger.info("Gemini AI service initialized successfully")
            else:
                logger.warning("Google AI API key not configured - AI service disabled")
                self.model = None
        except Exception as e:
            logger.error(f"Error initializing Gemini AI: {str(e)}")
            self.model = None

    def generate_recommendations(self, trip_id: str) -> List[Recommendation]:
        """
        Generate AI-powered destination recommendations for a trip

        Args:
            trip_id: UUID of the trip

        Returns:
            List of created Recommendation objects

        Raises:
            Exception: If AI generation fails
        """
        try:
            if not self.model:
                logger.warning("AI service not available - generating fallback recommendations")
                return self._generate_fallback_recommendations(trip_id)

            # Get trip details
            trip = self.db.query(Trip).filter(Trip.id == trip_id).first()
            if not trip:
                raise Exception("Trip not found")

            # Get all preferences for this trip
            preferences = self.db.query(Preference).filter(Preference.trip_id == trip_id).all()

            if not preferences:
                logger.info("No preferences found - generating generic recommendations")
                return self._generate_fallback_recommendations(trip_id)

            # Build AI prompt
            prompt = self._build_ai_prompt(trip, preferences)

            # Generate recommendations
            response = self.model.generate_content(prompt)

            if not response.text:
                logger.error("Empty response from Gemini AI")
                return self._generate_fallback_recommendations(trip_id)

            # Parse AI response
            try:
                # Try to extract JSON from response
                ai_response_text = response.text.strip()

                # Look for JSON block in the response
                if "```json" in ai_response_text:
                    json_start = ai_response_text.find("```json") + 7
                    json_end = ai_response_text.find("```", json_start)
                    json_text = ai_response_text[json_start:json_end].strip()
                else:
                    json_text = ai_response_text

                recommendations_data = json.loads(json_text)

                if "recommendations" not in recommendations_data:
                    logger.error("Invalid AI response format")
                    return self._generate_fallback_recommendations(trip_id)

                return self._create_recommendations_from_ai(trip_id, recommendations_data["recommendations"])

            except json.JSONDecodeError as e:
                logger.error(f"Error parsing AI response JSON: {str(e)}")
                return self._generate_fallback_recommendations(trip_id)

        except Exception as e:
            logger.error(f"Error generating AI recommendations: {str(e)}")
            return self._generate_fallback_recommendations(trip_id)

    def _build_ai_prompt(self, trip: Trip, preferences: List[Preference]) -> str:
        """Build AI prompt with trip and preference data"""

        # Group preferences by type
        preference_data = {}
        for pref in preferences:
            preference_data[pref.preference_type.value] = pref.preference_data

        # Get participant count
        participant_count = self.db.query(Preference.user_id).filter(
            Preference.trip_id == trip.id
        ).distinct().count()

        prompt = f"""
You are a travel recommendation expert specializing in group trips. Based on the provided group preferences, generate 3-5 destination recommendations in JSON format.

Trip Information:
- Title: {trip.title}
- Description: {trip.description or 'Not specified'}
- Budget Range: ${trip.budget_min or 'Not specified'} - ${trip.budget_max or 'Not specified'} per person
- Travel Dates: {trip.start_date or 'Flexible'} to {trip.end_date or 'Flexible'}
- Group Size: {participant_count} people

Group Preferences:
"""

        # Add preferences to prompt
        if "budget" in preference_data:
            budget_pref = preference_data["budget"]
            prompt += f"""
Budget Preferences:
- Min Budget: ${budget_pref.get('min_budget', 'Not specified')}
- Max Budget: ${budget_pref.get('max_budget', 'Not specified')}
- Currency: {budget_pref.get('currency', 'USD')}
- Per Person: {budget_pref.get('per_person', True)}
"""

        if "dates" in preference_data:
            dates_pref = preference_data["dates"]
            prompt += f"""
Date Preferences:
- Available Dates: {', '.join(dates_pref.get('available_dates', []))}
- Flexible Dates: {dates_pref.get('flexible_dates', True)}
- Duration: {dates_pref.get('preferred_duration_min', 'Flexible')} - {dates_pref.get('preferred_duration_max', 'Flexible')} days
"""

        if "activities" in preference_data:
            activities_pref = preference_data["activities"]
            prompt += f"""
Activity Preferences:
- Preferred Activities: {', '.join(activities_pref.get('preferred_activities', []))}
- Activity Level: {activities_pref.get('activity_level', 'moderate')}
- Must-Have Activities: {', '.join(activities_pref.get('must_have_activities', []))}
- Avoid Activities: {', '.join(activities_pref.get('avoid_activities', []))}
"""

        if "accommodation" in preference_data:
            acc_pref = preference_data["accommodation"]
            prompt += f"""
Accommodation Preferences:
- Types: {', '.join(acc_pref.get('preferred_types', []))}
- Room Preference: {acc_pref.get('room_preference', 'any')}
- Required Amenities: {', '.join(acc_pref.get('amenities', []))}
"""

        if "transportation" in preference_data:
            trans_pref = preference_data["transportation"]
            prompt += f"""
Transportation Preferences:
- Preferred Modes: {', '.join(trans_pref.get('preferred_modes', []))}
- Comfort Level: {trans_pref.get('comfort_level', 'medium')}
- Environmental Impact Priority: {trans_pref.get('environmental_impact', 'medium')}
"""

        if "vibe" in preference_data:
            vibe_pref = preference_data["vibe"]
            prompt += f"""
Trip Vibe Preferences:
- Vibe: {', '.join(vibe_pref.get('trip_vibe', []))}
- Group Size Preference: {vibe_pref.get('group_size_preference', 'flexible')}
- Planning Style: {vibe_pref.get('planning_style', 'balanced')}
- Social Atmosphere: {vibe_pref.get('social_atmosphere', 'moderate')}
"""

        prompt += """
Generate recommendations in this exact JSON format:
```json
{
  "recommendations": [
    {
      "destination": "City, Country",
      "description": "Why this destination fits the group perfectly",
      "estimated_cost_per_person": "$X,XXX",
      "highlights": ["highlight1", "highlight2", "highlight3"],
      "best_for": "type of travelers or groups",
      "weather_info": "expected conditions during travel period",
      "activities": ["activity1", "activity2", "activity3"],
      "accommodation_options": ["option1", "option2"],
      "transportation_notes": "how to get there and get around"
    }
  ]
}
```

Make sure each recommendation:
1. Fits within the specified budget range
2. Matches the activity preferences and vibe
3. Is suitable for the group size
4. Has practical transportation and accommodation options
5. Includes realistic cost estimates

Generate 3-5 diverse recommendations that would work well for this specific group.
"""

        return prompt

    def _create_recommendations_from_ai(self, trip_id: str, recommendations_data: List[Dict]) -> List[Recommendation]:
        """Create Recommendation objects from AI response data"""
        created_recommendations = []

        try:
            for rec_data in recommendations_data:
                recommendation = Recommendation(
                    trip_id=trip_id,
                    destination_name=rec_data.get("destination", "Unknown Destination"),
                    description=rec_data.get("description", ""),
                    estimated_cost=self._parse_cost(rec_data.get("estimated_cost_per_person")),
                    activities=rec_data.get("activities", []),
                    accommodation_options=rec_data.get("accommodation_options", []),
                    transportation_options=[rec_data.get("transportation_notes", "")],
                    ai_generated=True
                )

                self.db.add(recommendation)
                created_recommendations.append(recommendation)

            self.db.commit()

            for rec in created_recommendations:
                self.db.refresh(rec)

            logger.info(f"Created {len(created_recommendations)} AI recommendations for trip {trip_id}")
            return created_recommendations

        except Exception as e:
            logger.error(f"Error creating recommendations from AI data: {str(e)}")
            self.db.rollback()
            return []

    def _parse_cost(self, cost_string: str) -> Optional[float]:
        """Parse cost string to extract numeric value"""
        if not cost_string:
            return None

        try:
            # Extract numeric value from strings like "$1,500" or "$1,500-$2,000"
            import re
            cost_match = re.search(r'\$?([0-9,]+)', cost_string.replace(',', ''))
            if cost_match:
                return float(cost_match.group(1))
        except Exception:
            pass

        return None

    def _generate_fallback_recommendations(self, trip_id: str) -> List[Recommendation]:
        """Generate fallback recommendations when AI is not available"""
        logger.info(f"Generating fallback recommendations for trip {trip_id}")

        fallback_recs = [
            {
                "destination": "Barcelona, Spain",
                "description": "Perfect blend of culture, beaches, and vibrant nightlife. Great for groups with diverse interests.",
                "estimated_cost_per_person": "$1,200",
                "highlights": ["Amazing architecture", "Beach activities", "Great food scene", "Affordable prices"],
                "best_for": "Cultural enthusiasts and beach lovers",
                "weather_info": "Mediterranean climate with warm summers and mild winters",
                "activities": ["Sightseeing", "Beach time", "Food tours", "Museum visits"],
                "accommodation_options": ["Hotels", "Airbnb", "Hostels"],
                "transportation_notes": "Well-connected by air, excellent public transport"
            },
            {
                "destination": "Lisbon, Portugal",
                "description": "Charming coastal city with historic neighborhoods, great food, and affordable prices.",
                "estimated_cost_per_person": "$1,000",
                "highlights": ["Historic trams", "Coastline views", "Pastries", "Affordable dining"],
                "best_for": "Budget-conscious travelers and culture seekers",
                "weather_info": "Mild climate year-round, best in spring and fall",
                "activities": ["Historic tours", "Beach visits", "Food exploration", "Day trips"],
                "accommodation_options": ["Boutique hotels", "Guesthouses", "Apartments"],
                "transportation_notes": "Walkable city center, good tram and metro system"
            },
            {
                "destination": "Prague, Czech Republic",
                "description": "Fairytale city with stunning architecture, rich history, and excellent beer culture.",
                "estimated_cost_per_person": "$800",
                "highlights": ["Castle views", "Old Town Square", "Beer gardens", "Affordable prices"],
                "best_for": "History buffs and budget travelers",
                "weather_info": "Four distinct seasons, beautiful in spring and fall",
                "activities": ["Historic tours", "Castle visits", "Beer tasting", "River cruises"],
                "accommodation_options": ["Historic hotels", "Hostels", "Apartments"],
                "transportation_notes": "Walkable city center, efficient public transport"
            }
        ]

        return self._create_recommendations_from_ai(trip_id, fallback_recs)