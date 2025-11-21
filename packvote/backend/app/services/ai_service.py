import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from ..models import Preference, Recommendation, Trip, User
from ..config import settings
from ..schemas.preference import PreferenceType
from ..models import Participant

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

            # Get participants and their locations
            participants = self.db.query(User).join(Participant).filter(Participant.trip_id == trip_id).all()
            participant_locations = [f"{p.name}: {p.location or 'Unknown'}" for p in participants]
            
            # Build prompt and call Gemini
            prompt = self._build_ai_prompt(trip, preferences, participant_locations)
            
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
                # Validate with Pydantic
                from ..schemas.ai_recommendation import AIResponse
                
                # First parse as dict to handle potential loose JSON
                data_dict = json.loads(json_text)
                
                # Validate against schema
                validated_response = AIResponse(**data_dict)
                
                return self._create_recommendations_from_ai(trip_id, validated_response.recommendations)

            except (json.JSONDecodeError, Exception) as e:
                logger.error(f"Error parsing/validating AI response: {str(e)}")
                print(f"DEBUG: Error parsing/validating AI response: {str(e)}")
                self._log_debug(f"Error parsing/validating AI response: {str(e)}")
                return self._generate_fallback_recommendations(trip_id)

        except Exception as e:
            logger.error(f"Error generating AI recommendations: {str(e)}")
            print(f"DEBUG: Error generating AI recommendations: {str(e)}")
            self._log_debug(f"Error generating AI recommendations: {str(e)}")
            import traceback
            traceback.print_exc()
            self._log_debug(traceback.format_exc())
            return self._generate_fallback_recommendations(trip_id)

    def _build_ai_prompt(self, trip: Trip, preferences: List[Preference], participant_locations: List[str]) -> str:
        """Build enhanced AI prompt with trip and preference data"""

        # Group preferences by type
        preference_data = {}
        for pref in preferences:
            preference_data[pref.preference_type.value] = pref.preference_data

        # Get participant count
        participant_count = len(participant_locations)
        expected_size = trip.expected_participants or participant_count
        
        locations_str = ", ".join(participant_locations)

        prompt = f"""You are an expert travel AI specializing in group trips. Generate UNIQUE and DIVERSE destination recommendations.

TRIP CONTEXT:
┌─────────────────────────┬──────────────────────────────────┐
│ Trip Title              │ {trip.title[:30]}                │
│ Expected Group Size     │ {expected_size} people           │
│ Budget (per person)     │ ${trip.budget_min or 'Flex'} - ${trip.budget_max or 'Flex'} │
│ Travel Dates            │ {trip.start_date or 'Flexible'} to {trip.end_date or 'Flexible'} │
│ Destination Preference  │ {trip.destination or 'Open'}     │
│ Participant Locations   │ {locations_str}                  │
└─────────────────────────┴──────────────────────────────────┘

GROUP PREFERENCES:
"""

        # Add preferences
        if "detailed" in preference_data:
            detailed = preference_data["detailed"]
            if detailed.get("accommodation_type"): prompt += f"• Accommodation Type: {detailed['accommodation_type']}\n"
            if detailed.get("accommodation_amenities"): prompt += f"• Required Amenities: {', '.join(detailed['accommodation_amenities'])}\n"
            if detailed.get("must_have_activities"): prompt += f"• Must-Do Activities: {', '.join(detailed['must_have_activities'])}\n"
            if detailed.get("avoid_activities"): prompt += f"• Avoid Activities: {', '.join(detailed['avoid_activities'])}\n"
            if detailed.get("dietary_restrictions"): prompt += f"• Dietary Restrictions: {', '.join(detailed['dietary_restrictions'])}\n"
            if detailed.get("trip_description"): prompt += f"• Trip Description/Notes: {detailed['trip_description']}\n"

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
   
3. PERSONALIZED LOGISTICS:
   • Consider where participants are traveling from ({locations_str}).
   • Suggest destinations that are reasonably accessible for everyone.
   • Provide estimated cost breakdown per person based on their origin (flights + stay).

4. STRICT JSON FORMAT:
   • You must return ONLY valid JSON matching the schema below.
   • No markdown formatting, no extra text.

JSON SCHEMA:
{{
  "recommendations": [
    {{
      "destination": "City, Country",
      "continent": "Continent Name",
      "experience_type": "beach|mountain|city|cultural|adventure",
      "description": "2-3 sentences why perfect for THIS group",
      "estimated_cost_per_person": "$X,XXX (Average)",
      "cost_breakdown": {{
        "User Name (Location)": "$X,XXX",
        "User Name 2 (Location)": "$X,XXX"
      }},
      "highlights": ["Attraction 1", "Attraction 2", "Attraction 3", "Attraction 4", "Attraction 5"],
      "best_for": "Type of travelers",
      "weather_info": "Expected weather during specific travel dates",
      "activities": ["activity1", "activity2", "activity3", "activity4"],
      "accommodation_options": ["Specific hotel/area 1", "Specific hotel/area 2"],
      "transportation_notes": "How to get there and around",
      "match_reason": "Why this matches the group's specific preferences"
    }}
  ]
}}

Generate 3-5 COMPLETELY DIFFERENT recommendations.
"""
        return prompt

    def _create_recommendations_from_ai(self, trip_id: str, recommendations_data: List[Any]) -> List[Recommendation]:
        """Create Recommendation objects from AI response data"""
        created_recommendations = []

        try:
            for rec_data in recommendations_data:
                # Convert Pydantic model to dict if needed
                if hasattr(rec_data, 'model_dump'):
                    rec_dict = rec_data.model_dump()
                else:
                    rec_dict = rec_data

                recommendation = Recommendation(
                    trip_id=trip_id,
                    destination_name=rec_dict.get("destination", "Unknown Destination"),
                    description=rec_dict.get("description", ""),
                    estimated_cost=self._parse_cost(rec_dict.get("estimated_cost_per_person")),
                    activities=rec_dict.get("activities", [])[:10],
                    accommodation_options=rec_dict.get("accommodation_options", []),
                    # transportation_options removed from here as it's not in the model
                    weather_info=rec_dict.get("weather_info"),
                    meta={
                        "continent": rec_dict.get("continent"),
                        "experience_type": rec_dict.get("experience_type"),
                        "cost_breakdown": rec_dict.get("cost_breakdown"),
                        "match_reason": rec_dict.get("match_reason"),
                        "best_for": rec_dict.get("best_for"),
                        "highlights": rec_dict.get("highlights"),
                        "transportation_options": [rec_dict.get("transportation_notes", "")]
                    },
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
            print(f"DEBUG: Error creating recommendations from AI data: {str(e)}")
            import traceback
            traceback.print_exc()
            self.db.rollback()
            return []

    def _parse_cost(self, cost_string: str) -> Optional[float]:
        """Parse cost string to extract numeric value"""
        if not cost_string:
            return None
        try:
            import re
            cost_match = re.search(r'\$?([0-9,]+)', str(cost_string).replace(',', ''))
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
                "description": "Perfect blend of culture, beaches, and vibrant nightlife.",
                "estimated_cost_per_person": "$1,200",
                "highlights": ["Sagrada Familia", "Park Güell"],
                "weather_info": "Sunny, 25°C",
                "activities": ["Sightseeing", "Beach"],
                "continent": "Europe", 
                "experience_type": "City/Beach",
                "cost_breakdown": {"User 1 (New York)": "$1500", "User 2 (London)": "$1200"},
                "match_reason": "Good for culture and relaxation",
                "best_for": "Cultural enthusiasts and beach lovers",
                "accommodation_options": ["Hotel Arts Barcelona", "W Barcelona"],
                "transportation_notes": "Fly into BCN, use metro for city travel"
            },
            {
                "destination": "Kyoto, Japan",
                "description": "Immerse in ancient traditions, stunning temples, and serene gardens.",
                "estimated_cost_per_person": "$2,500",
                "highlights": ["Kinkaku-ji", "Fushimi Inari-taisha", "Arashiyama Bamboo Grove"],
                "weather_info": "Mild, 18°C",
                "activities": ["Temple visits", "Tea ceremonies"],
                "continent": "Asia", 
                "experience_type": "Cultural",
                "cost_breakdown": {"User 1 (New York)": "$3000", "User 2 (London)": "$2800"},
                "match_reason": "Rich cultural experience",
                "best_for": "History buffs and serene travelers",
                "accommodation_options": ["Ryokan in Gion", "Kyoto Hotel Okura"],
                "transportation_notes": "Fly into KIX, take train to Kyoto, use buses/subway"
            }
        ]
        return self._create_recommendations_from_ai(trip_id, fallback_recs)