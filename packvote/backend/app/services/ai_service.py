from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import json
import logging

from ..models import Preference, Recommendation, Trip, User, Participant
from ..config import settings
from ..schemas.preference import PreferenceType
from .unsplash_service import unsplash_service

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

    async def generate_recommendations(self, trip_id: str) -> List[Recommendation]:
        """
        Generate AI-powered destination recommendations for a trip
        """
        self._log_debug(f"Generating recommendations for trip {trip_id}")
        try:
            if not self.model:
                logger.warning("AI service not available - generating fallback recommendations")
                self._log_debug("AI service not available (self.model is None)")
                return await self._generate_fallback_recommendations(trip_id)

            # Get trip details
            trip = self.db.query(Trip).filter(Trip.id == trip_id).first()
            if not trip:
                raise Exception("Trip not found")

            # Get all preferences for this trip
            preferences = self.db.query(Preference).filter(Preference.trip_id == trip_id).all()

            # Get participants and their locations
            participants = self.db.query(User).join(Participant).filter(Participant.trip_id == trip_id).all()
            participant_locations = [f"{p.name}: {p.location or 'Unknown'}" for p in participants]
            
            all_recommendations_data = []
            generated_destinations = []
            
            # BATCH GENERATION: 6 batches of 1 = 6 total
            for batch_num in range(6):
                self._log_debug(f"Generating Batch {batch_num + 1}/6")
                
                # Build prompt with exclusions
                prompt = self._build_ai_prompt(
                    trip, 
                    preferences, 
                    participant_locations, 
                    num_recommendations=1, 
                    exclude_destinations=generated_destinations
                )
                
                self._log_debug("\n" + "="*50)
                self._log_debug(f"SENDING REQUEST TO GEMINI ({settings.GEMINI_MODEL}) - BATCH {batch_num + 1}")
                self._log_debug("="*50)
                # self._log_debug(f"FULL PROMPT:\n{prompt}") 
                self._log_debug("="*50)

                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.7,
                        max_output_tokens=8192,
                    )
                )
                ai_response_text = response.text
                
                self._log_debug("\n" + "="*50)
                self._log_debug(f"RECEIVED RESPONSE FROM GEMINI - BATCH {batch_num + 1}")
                self._log_debug("="*50)
                self._log_debug(f"RAW RESPONSE:\n{ai_response_text}")
                self._log_debug("="*50)

                # Clean and Extract JSON
                json_text = self._clean_json_string(ai_response_text)

                try:
                    # Validate with Pydantic
                    from ..schemas.ai_recommendation import AIResponse
                    
                    # First parse as dict to handle potential loose JSON
                    data_dict = json.loads(json_text)
                    
                    # Validate against schema
                    validated_response = AIResponse(**data_dict)
                    
                    # Add to collection
                    for rec in validated_response.recommendations:
                        # Normalize destination name for exclusion check
                        dest_name = rec.destination or rec.location or "Unknown"
                        generated_destinations.append(dest_name)
                        all_recommendations_data.append(rec)

                except (json.JSONDecodeError, Exception) as e:
                    logger.error(f"Error parsing/validating AI response (Batch {batch_num + 1}): {str(e)}")
                    self._log_debug(f"Error parsing/validating AI response (Batch {batch_num + 1}): {str(e)}")
                    # Continue to next batch if one fails
                    pass

            if not all_recommendations_data:
                logger.warning("No valid recommendations generated from any batch")
                return await self._generate_fallback_recommendations(trip_id)

            return await self._create_recommendations_from_ai(trip_id, all_recommendations_data)

        except Exception as e:
            logger.error(f"Error generating AI recommendations: {str(e)}")
            import traceback
            traceback.print_exc()
            self._log_debug(traceback.format_exc())
            return await self._generate_fallback_recommendations(trip_id)

    async def generate_personalization(self, destination: str, user_location: str, currency: str = "USD") -> Dict[str, Any]:
        """
        Generate personalized cost and description for a specific user location
        """
        self._log_debug(f"Generating personalization for {destination} from {user_location} in {currency}")
        
        if not self.model:
            return {
                "estimated_cost": None,
                "description": "AI service unavailable for personalization.",
                "travel_time": "Unknown"
            }

        prompt = f"""
        You are a travel expert.
        Calculate the estimated travel cost and provide a brief travel description for a trip to {destination} starting from {user_location}.
        
        Assume a standard 1-week trip duration.
        
        Return ONLY valid JSON in this format:
        {{
            "estimated_cost_from_origin": "Numeric value only (e.g. 1200)",
            "currency": "{currency}",
            "personalized_description": "2 sentences describing the travel route/options and why it's good from this origin.",
            "travel_time": "Approximate flight/travel time (e.g. '6 hours')"
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text
            
            # Extract JSON
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                json_text = text[json_start:json_end]
                return json.loads(json_text)
            else:
                return {"error": "Failed to parse AI response"}
                
        except Exception as e:
            logger.error(f"Error generating personalization: {str(e)}")
            return {"error": str(e)}

    def get_currency_for_location(self, location: str) -> tuple[str, str]:
        """Determine currency code and symbol for a single location"""
        if not location:
            return 'USD', '$'
            
        text = location.lower()
        if any(x in text for x in ['uk', 'united kingdom', 'london', 'england', 'scotland', 'wales']):
            return 'GBP', '£'
        if any(x in text for x in ['eu', 'europe', 'france', 'germany', 'italy', 'spain', 'netherlands', 'ireland', 'austria', 'belgium', 'portugal', 'greece', 'finland']):
            return 'EUR', '€'
        if any(x in text for x in ['japan', 'tokyo', 'osaka', 'kyoto']):
            return 'JPY', '¥'
        if any(x in text for x in ['india', 'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata']):
            return 'INR', '₹'
        if any(x in text for x in ['australia', 'sydney', 'melbourne']):
            return 'AUD', 'A$'
        if any(x in text for x in ['canada', 'toronto', 'vancouver']):
            return 'CAD', 'C$'
            
        return 'USD', '$'

    def _determine_currency(self, locations: List[str]) -> tuple[str, str]:
        """Determine currency code and symbol based on participant locations"""
        # Use the first non-USD currency found, or default to USD
        for loc in locations:
            code, symbol = self.get_currency_for_location(loc)
            if code != 'USD':
                return code, symbol
        return 'USD', '$'

    def _clean_json_string(self, json_str: str) -> str:
        """Clean potential markdown formatting from JSON string"""
        # Remove markdown code blocks
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
             json_str = json_str.split("```")[1].split("```")[0]
        
        # Find the first '{' and last '}'
        start = json_str.find('{')
        end = json_str.rfind('}') + 1
        if start != -1 and end != -1:
            json_str = json_str[start:end]
            
        return json_str.strip()

    def _build_ai_prompt(self, trip: Trip, preferences: List[Preference], participant_locations: List[str], num_recommendations: int = 3, exclude_destinations: List[str] = None) -> str:
        """Build enhanced AI prompt with trip and preference data"""
        
        # Group preferences by type
        preference_data = {}
        for pref in preferences:
            preference_data[pref.preference_type.value] = pref.preference_data

        # Get participant count
        expected_size = trip.expected_participants or "Unknown"

        # Determine Currency
        currency_code, currency_symbol = self._determine_currency(participant_locations)
        
        # Format locations
        locations_str = ", ".join(participant_locations) if participant_locations else "Various"

        # Extract preference types
        detailed = preference_data.get('detailed', {})
        vibe = preference_data.get('vibe', {})

        # Determine User Intent
        specific_location = trip.destination if trip.destination and trip.destination.lower() != "open" else None
        
        # Get Trip Duration
        duration_days = 7 # Default
        if trip.start_date and trip.end_date:
             try:
                 delta = trip.end_date - trip.start_date
                 duration_days = delta.days + 1
             except:
                 pass

        # 2. Override with explicit preference if set
        if detailed and detailed.get('duration_days'):
             duration_days = detailed.get('duration_days')

        prompt = f"""You are an expert travel AI specializing in group trips.
        
TRIP CONTEXT:
┌─────────────────────────┬──────────────────────────────────┐
│ Trip Title              │ {trip.title[:30]}                │
│ Expected Group Size     │ {expected_size} people           │
│ Trip Duration           │ {duration_days} days             │
│ Budget (per person)     │ {currency_symbol}{trip.budget_min or 'Flex'} - {currency_symbol}{trip.budget_max or 'Flex'} ({currency_code}) │
│ Travel Dates            │ {trip.start_date or 'Flexible'} to {trip.end_date or 'Flexible'} │
│ Destination Input       │ {specific_location or 'Open/Undecided'}     │
│ Participant Locations   │ {locations_str}                  │
└─────────────────────────┴──────────────────────────────────┘

GROUP PREFERENCES:
"""
        if detailed:
            if detailed.get("accommodation_type"): prompt += f"• Accommodation: {detailed.get('accommodation_type')}\\n"
            if detailed.get("accommodation_amenities"): prompt += f"• Amenities: {', '.join(detailed.get('accommodation_amenities', []))}\\n"
            if detailed.get("must_have_activities"): prompt += f"• Must-Do: {', '.join(detailed.get('must_have_activities', []))}\\n"
            if detailed.get("avoid_activities"): prompt += f"• Avoid: {', '.join(detailed.get('avoid_activities', []))}\\n"
            if detailed.get("dietary_restrictions"): prompt += f"• Dietary: {', '.join(detailed.get('dietary_restrictions', []))}\\n"
            if detailed.get("trip_description"): prompt += f"• Notes: {detailed.get('trip_description')}\\n"

        if vibe:
             vibes = ', '.join(vibe.get('trip_vibe', []))
             prompt += f"• Vibe: {vibes}\\n"

        prompt += """
PRIORITY LOGIC (Follow EXACTLY):
1. USER INTENT IS KING:
   - Interpret the "Destination Input" and "Notes" above.
   - If a specific place is named (e.g. "Hamburg"), recommendations MUST be relevant to it.
   - If a theme is named (e.g. "escape winter"), recommendations MUST fulfill it.

2. IF SPECIFIC LOCATION PROVIDED (e.g. "Hamburg", "Tokyo"):
   - Suggest the location itself (if suitable).
   - Suggest nearby alternatives (same region/country).
   - Suggest same-theme options (e.g. if "Tokyo" -> other major tech/culture hubs).
   - DO NOT suggest random global destinations unless explicitly asked.

3. IF NO LOCATION (Generic Themes only):
   - Suggest GLOBALLY DIVERSE options.
   - Different continents.
   - Different climates/vibes.
"""
        if exclude_destinations:
            prompt += f"\\n4. EXCLUSIONS: Do NOT recommend the following destinations: {', '.join(exclude_destinations)}\\n"

        prompt += f"""
Return ONLY valid JSON in this format:
{{
  "recommendations": [
    {{
      "destination": "City, Country",
      "description": "2-3 sentences why perfect for THIS group",
      "estimated_cost_per_person": "{currency_symbol}X,XXX (Average)",
      "highlights": ["Attraction 1", "Attraction 2", "Attraction 3", "Attraction 4", "Attraction 5"],
      "best_for": "Type of travelers",
      "weather_info": "Expected weather during specific travel dates",
      "activities": ["activity1", "activity2", "activity3", "activity4"],
      "accommodation_options": ["Specific hotel/area 1", "Specific hotel/area 2"],
      "continent": "Continent Name",
      "experience_type": "beach|mountain|city|cultural|adventure",
      "cost_breakdown": {{
        "User Name (Location)": "{currency_symbol}X,XXX",
        "User Name 2 (Location)": "{currency_symbol}X,XXX"
      }},
      "transportation_notes": "How to get there and around",
      "match_reason": "EXPLICIT explanation of how this fits the user's specific intent (Priority 4)",
      "itinerary": [
        {{
          "day": 1,
          "focus": "Arrival & Exploration",
          "morning": "Activity...",
          "afternoon": "Activity...",
          "evening": "Activity..."
        }},
        {{
          "day": 2,
          "focus": "Culture & History",
          "morning": "Activity...",
          "afternoon": "Activity...",
          "evening": "Activity..."
        }}
      ],
      "dining_recommendations": [
        {{
          "name": "Restaurant Name",
          "cuisine": "Italian/Local/etc",
          "price_range": "$$-$$$",
          "description": "Why it fits the group (e.g. good for large groups, vegan options)"
        }}
      ]
    }}
  ]
}}

Generate EXACTLY {num_recommendations} recommendations based on the Priority Logic.
IMPORTANT: You MUST provide exactly {num_recommendations} distinct recommendations.
IMPORTANT: Use the key "destination" for the place name. DO NOT use "location".
IMPORTANT: Provide a detailed day-by-day itinerary for the FULL duration of the trip (up to 7 days detailed, summarize if longer).
IMPORTANT: For "cost_breakdown", try to estimate flight+stay costs for each participant location based on the destination.
IMPORTANT: Return RAW JSON only. Do not use Markdown code blocks. Do not include comments. Ensure all keys and values are double-quoted.
"""
        return prompt

    async def _create_recommendations_from_ai(self, trip_id: str, recommendations_data: List[Any]) -> List[Recommendation]:
        """Create Recommendation objects from AI response data"""
        created_recommendations = []

        try:
            for rec_data in recommendations_data:
                # Convert Pydantic model to dict if needed
                if hasattr(rec_data, 'model_dump'):
                    rec_dict = rec_data.model_dump()
                else:
                    rec_dict = rec_data

                # Detect currency from cost string
                cost_str = rec_dict.get("estimated_cost_per_person", "")
                currency_code = "USD" # Default
                if "€" in cost_str or "EUR" in cost_str:
                    currency_code = "EUR"
                elif "£" in cost_str or "GBP" in cost_str:
                    currency_code = "GBP"
                elif "¥" in cost_str or "JPY" in cost_str:
                    currency_code = "JPY"
                elif "₹" in cost_str or "INR" in cost_str:
                    currency_code = "INR"

                recommendation = Recommendation(
                    trip_id=trip_id,
                    destination_name=rec_dict.get("destination") or rec_dict.get("location") or "Unknown Destination",
                    description=rec_dict.get("description", ""),
                    estimated_cost=self._parse_cost(cost_str),
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
                        "transportation_options": [rec_dict.get("transportation_notes", "")],
                        "currency": currency_code,
                        "itinerary": rec_dict.get("itinerary", []),
                        "dining_recommendations": rec_dict.get("dining_recommendations", [])
                    },
                    ai_generated=True
                )

                # Fetch image from Unsplash
                image_url = await unsplash_service.get_photo_url(recommendation.destination_name)
                if image_url:
                    recommendation.image_url = image_url


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

    async def _generate_fallback_recommendations(self, trip_id: str) -> List[Recommendation]:
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
                "transportation_notes": "Fly into BCN, use metro for city travel",
                "itinerary": [
                    {"day": 1, "focus": "Arrival", "morning": "Check-in", "afternoon": "Ramble on Las Ramblas", "evening": "Tapas dinner"},
                    {"day": 2, "focus": "Gaudi", "morning": "Sagrada Familia", "afternoon": "Park Guell", "evening": "Gothic Quarter"}
                ],
                "dining_recommendations": [
                    {"name": "Cervecería Catalana", "cuisine": "Tapas", "price_range": "$$", "description": "Famous for tapas"},
                    {"name": "Disfrutar", "cuisine": "Modern Spanish", "price_range": "$$$$", "description": "Michelin star experience"}
                ]
            },
            {
                "destination": "Kyoto, Japan",
                "description": "Immerse yourself in ancient traditions and stunning temples.",
                "estimated_cost_per_person": "$2,000",
                "highlights": ["Kinkaku-ji", "Fushimi Inari-taisha"],
                "weather_info": "Mild, 18°C",
                "activities": ["Temple visiting", "Tea ceremony"],
                "continent": "Asia",
                "experience_type": "Cultural",
                "cost_breakdown": {"User 1 (New York)": "$2500", "User 2 (London)": "$2200"},
                "match_reason": "Rich history and culture",
                "best_for": "History buffs",
                "accommodation_options": ["Ryokan", "Hotel Granvia"],
                "transportation_notes": "Shinkansen from Tokyo",
                "itinerary": [
                    {"day": 1, "focus": "Temples", "morning": "Kinkaku-ji", "afternoon": "Ryoan-ji", "evening": "Gion district"},
                    {"day": 2, "focus": "Nature", "morning": "Arashiyama Bamboo Grove", "afternoon": "Tenryu-ji", "evening": "Pontocho Alley"}
                ],
                "dining_recommendations": [
                    {"name": "Kikunoi", "cuisine": "Kaiseki", "price_range": "$$$$", "description": "Traditional multi-course dinner"},
                    {"name": "Ippudo", "cuisine": "Ramen", "price_range": "$", "description": "Famous ramen chain"}
                ]
            }
        ]
        return await self._create_recommendations_from_ai(trip_id, fallback_recs)