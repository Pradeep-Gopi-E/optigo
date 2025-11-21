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

    def _log_debug(self, message: str):
        try:
            with open("ai_debug.log", "a", encoding="utf-8") as f:
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                f.write(f"[{timestamp}] {message}\n")
        except Exception:
            pass

    def _initialize_gemini(self):
        """Initialize Gemini AI client"""
        self._log_debug("Initializing Gemini AI...")
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
                self._log_debug("Gemini AI service initialized successfully")
            else:
                logger.warning("Google AI API key not configured - AI service disabled")
                self._log_debug("Google AI API key not configured")
                self.model = None
        except Exception as e:
            logger.error(f"Error initializing Gemini AI: {str(e)}")
            self._log_debug(f"Error initializing Gemini AI: {str(e)}")
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
        self._log_debug(f"Generating recommendations for trip {trip_id}")
        try:
            if not self.model:
                logger.warning("AI service not available - generating fallback recommendations")
                self._log_debug("AI service not available (self.model is None)")
                return self._generate_fallback_recommendations(trip_id)

            # Get trip details
            trip = self.db.query(Trip).filter(Trip.id == trip_id).first()
            if not trip:
                raise Exception("Trip not found")

            # Get all preferences for this trip
            preferences = self.db.query(Preference).filter(Preference.trip_id == trip_id).all()

            # Build prompt and call Gemini
            prompt = self._build_ai_prompt(trip, preferences)
            
            self._log_debug("\n" + "="*50)
            self._log_debug(f"SENDING REQUEST TO GEMINI ({settings.GEMINI_MODEL})")
            self._log_debug("="*50)
            self._log_debug(f"FULL PROMPT:\n{prompt}")
            self._log_debug("="*50)

            response = self.model.generate_content(prompt)
            ai_response_text = response.text
            
            self._log_debug("\n" + "="*50)
            self._log_debug("RECEIVED RESPONSE FROM GEMINI")
            self._log_debug("="*50)
            self._log_debug(f"RAW RESPONSE:\n{ai_response_text}")
            self._log_debug("="*50)

            # Extract JSON
            json_start = ai_response_text.find('{')
            json_end = ai_response_text.rfind('}') + 1

            if json_start != -1 and json_end != -1:
                json_text = ai_response_text[json_start:json_end].strip()
            else:
                json_text = ai_response_text

            try:
                recommendations_data = json.loads(json_text)

                if "recommendations" not in recommendations_data:
                    logger.error("Invalid AI response format")
                    self._log_debug("Invalid AI response format (missing 'recommendations' key)")
                    return self._generate_fallback_recommendations(trip_id)

                return self._create_recommendations_from_ai(trip_id, recommendations_data["recommendations"])

            except json.JSONDecodeError as e:
                logger.error(f"Error parsing AI response JSON: {str(e)}")
                self._log_debug(f"Error parsing AI response JSON: {str(e)}")
                return self._generate_fallback_recommendations(trip_id)

        except Exception as e:
            logger.error(f"Error generating AI recommendations: {str(e)}")
            self._log_debug(f"Error generating AI recommendations: {str(e)}")
            import traceback
            self._log_debug(traceback.format_exc())
            return self._generate_fallback_recommendations(trip_id)

    def _build_ai_prompt(self, trip: Trip, preferences: List[Preference]) -> str:
        """Build enhanced AI prompt with trip and preference data"""

        # Group preferences by type
        preference_data = {}
        for pref in preferences:
            preference_data[pref.preference_type.value] = pref.preference_data

        # Get participant count
        participant_count = self.db.query(Preference.user_id).filter(
            Preference.trip_id == trip.id
        ).distinct().count()

        expected_size = trip.expected_participants or participant_count

        prompt = f"""You are an expert travel AI specializing in group trips. Generate UNIQUE and DIVERSE destination recommendations.

TRIP CONTEXT:
┌─────────────────────────┬──────────────────────────────────┐
│ Trip Title              │ {trip.title[:30]}                │
│ Expected Group Size     │ {expected_size} people           │
│ Budget (per person)     │ ${trip.budget_min or 'Flex'} - ${trip.budget_max or 'Flex'} │
│ Travel Dates            │ {trip.start_date or 'Flexible'} to {trip.end_date or 'Flexible'} │
│ Destination Preference  │ {trip.destination or 'Open'}     │
└─────────────────────────┴──────────────────────────────────┘

GROUP PREFERENCES:
"""

        # Add preferences
        if "detailed" in preference_data:
            detailed = preference_data["detailed"]
            
            if detailed.get("accommodation_type"):
                prompt += f"• Accommodation Type: {detailed['accommodation_type']}\n"
            
            if detailed.get("accommodation_amenities"):
                amenities = ', '.join(detailed['accommodation_amenities'])
                prompt += f"• Required Amenities: {amenities}\n"
                
            if detailed.get("must_have_activities"):
                must_haves = ', '.join(detailed['must_have_activities'])
                prompt += f"• Must-Do Activities: {must_haves}\n"

            if detailed.get("avoid_activities"):
                avoids = ', '.join(detailed['avoid_activities'])
                prompt += f"• Avoid Activities: {avoids}\n"

            if detailed.get("dietary_restrictions"):
                dietary = ', '.join(detailed['dietary_restrictions'])
                prompt += f"• Dietary Restrictions: {dietary}\n"

            if detailed.get("trip_description"):
                prompt += f"• Trip Description/Notes: {detailed['trip_description']}\n"

        if "vibe" in preference_data and "detailed" not in preference_data:
             vibe = preference_data["vibe"]
             vibes = ', '.join(vibe.get('trip_vibe', []))[:40]
             prompt += f"• Trip Vibe: {vibes}\n"

        prompt += f"""
CRITICAL REQUIREMENTS:
1. DIVERSITY IS MANDATORY - Each recommendation MUST be completely different:
   • Different regions/continents
   • Different experience types (beach vs mountain vs city vs cultural)
   • Different price points within budget
   
2. TOP ATTRACTIONS REQUIRED - For EACH destination include:
   • 5 SPECIFIC must-visit landmarks with actual names
   • Unique local experiences
   • Hidden gems locals recommend
   
3. BE SPECIFIC, NOT GENERIC:
   ❌ BAD: "Beautiful beaches"
   ✅ GOOD: "Nusa Dua Beach, Tanah Lot Temple, Ubud Monkey Forest"

4. GROUP-FRIENDLY for {expected_size} people
   • Ensure accommodation and activities can handle this group size.

5. RESPECT PREFERENCES:
   • If "must have" activities are listed, ONLY suggest destinations that excel in them.
   • If "avoid" activities are listed, DO NOT suggest destinations centered around them.
   • Respect dietary restrictions in food recommendations.

Generate in this EXACT JSON format:
```json
{{
  "recommendations": [
    {{
      "destination": "City, Country",
      "description": "2-3 sentences why perfect for THIS group and their specific preferences",
      "estimated_cost_per_person": "$X,XXX",
      "highlights": ["Specific Attraction 1", "Specific Attraction 2", "Specific Attraction 3", "Specific Attraction 4", "Specific Attraction 5"],
      "best_for": "Type of travelers",
      "weather_info": "Expected weather during travel dates",
      "activities": ["activity1", "activity2", "activity3", "activity4"],
      "accommodation_options": ["Specific hotel/area 1", "Specific hotel/area 2"],
      "transportation_notes": "How to get there and around",
      "match_reason": "Why this matches the group's specific preferences"
    }}
  ]
}}
```

Generate 3-5 COMPLETELY DIFFERENT recommendations. Each must be unique!
"""

        return prompt

    def _create_recommendations_from_ai(self, trip_id: str, recommendations_data: List[Dict]) -> List[Recommendation]:
        """Create Recommendation objects from AI response data"""
        created_recommendations = []

        try:
            for rec_data in recommendations_data:
                # Extract highlights as activities if activities not provided
                activities = rec_data.get("activities", rec_data.get("highlights", []))
                
                recommendation = Recommendation(
                    trip_id=trip_id,
                    destination_name=rec_data.get("destination", "Unknown Destination"),
                    description=rec_data.get("description", ""),
                    estimated_cost=self._parse_cost(rec_data.get("estimated_cost_per_person")),
                    activities=activities[:10],  # Limit to 10 activities
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
                "highlights": ["Sagrada Familia", "Park Güell", "La Rambla", "Gothic Quarter", "Barceloneta Beach"],
                "best_for": "Cultural enthusiasts and beach lovers",
                "weather_info": "Mediterranean climate with warm summers and mild winters",
                "activities": ["Sightseeing", "Beach time", "Food tours", "Museum visits"],
                "accommodation_options": ["Hotels in Eixample", "Airbnb in Gothic Quarter"],
                "transportation_notes": "Well-connected by air, excellent public transport"
            },
            {
                "destination": "Lisbon, Portugal",
                "description": "Charming coastal city with historic neighborhoods, great food, and affordable prices.",
                "estimated_cost_per_person": "$1,000",
                "highlights": ["Belém Tower", "Jerónimos Monastery", "São Jorge Castle", "Tram 28", "Alfama District"],
                "best_for": "Budget-conscious travelers and culture seekers",
                "weather_info": "Mild climate year-round, best in spring and fall",
                "activities": ["Historic tours", "Beach visits", "Food exploration", "Day trips"],
                "accommodation_options": ["Boutique hotels in Chiado", "Guesthouses in Bairro Alto"],
                "transportation_notes": "Walkable city center, good tram and metro system"
            },
            {
                "destination": "Prague, Czech Republic",
                "description": "Fairytale city with stunning architecture, rich history, and excellent beer culture.",
                "estimated_cost_per_person": "$800",
                "highlights": ["Prague Castle", "Charles Bridge", "Old Town Square", "Astronomical Clock", "Vyšehrad"],
                "best_for": "History buffs and budget travelers",
                "weather_info": "Four distinct seasons, beautiful in spring and fall",
                "activities": ["Historic tours", "Castle visits", "Beer tasting", "River cruises"],
                "accommodation_options": ["Historic hotels in Old Town", "Apartments in Malá Strana"],
                "transportation_notes": "Walkable city center, efficient public transport"
            }
        ]

        return self._create_recommendations_from_ai(trip_id, fallback_recs)