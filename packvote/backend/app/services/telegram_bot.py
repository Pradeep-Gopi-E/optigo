import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
import asyncio

from ..models import User, Trip, Participant, Preference
from ..schemas.preference import (
    BudgetPreference, DatesPreference, ActivitiesPreference,
    AccommodationPreference, TransportationPreference, VibePreference,
    PreferenceType
)
from ..config import settings

logger = logging.getLogger(__name__)


class TelegramBotService:
    """Service for handling Telegram bot interactions and surveys"""

    def __init__(self, db: Session):
        self.db = db
        self.application = None
        self._initialize_bot()

    def _initialize_bot(self):
        """Initialize Telegram bot"""
        try:
            if not settings.TELEGRAM_BOT_TOKEN:
                logger.warning("Telegram bot token not configured - bot service disabled")
                return

            # Create application
            self.application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()

            # Add handlers
            self.application.add_handler(CommandHandler("start", self._start_command))
            self.application.add_handler(CommandHandler("help", self._help_command))
            self.application.add_handler(CommandHandler("survey", self._survey_command))
            self.application.add_handler(CommandHandler("status", self._status_command))
            self.application.add_handler(CallbackQueryHandler(self._callback_handler))
            self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self._message_handler))

            logger.info("Telegram bot service initialized successfully")

        except Exception as e:
            logger.error(f"Error initializing Telegram bot: {str(e)}")

    async def _start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        try:
            welcome_message = """
🎉 Welcome to PackVote!

I help you collect group preferences for trip planning through simple surveys.

Here's how I can help:
• Complete trip preference surveys
• Check your survey status
• Get notifications about trip updates

Commands:
/survey <trip_id> - Start a preference survey
/status - Check your survey completion status
/help - Show this help message

To get started, ask your trip organizer for a trip ID and use /survey <trip_id>
            """
            await update.message.reply_text(welcome_message)

        except Exception as e:
            logger.error(f"Error in start command: {str(e)}")
            await update.message.reply_text("Sorry, I encountered an error. Please try again.")

    async def _help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command"""
        try:
            help_message = """
📋 PackVote Bot Commands:

/start - Welcome message and introduction
/help - Show this help message
/survey <trip_id> - Start preference survey for a specific trip
/status - Check your survey completion status

How surveys work:
1. Get a trip ID from your trip organizer
2. Use /survey <trip_id> to start
3. Answer questions about your preferences
4. Your answers help generate perfect trip recommendations!

Need help? Contact your trip organizer.
            """
            await update.message.reply_text(help_message)

        except Exception as e:
            logger.error(f"Error in help command: {str(e)}")
            await update.message.reply_text("Sorry, I encountered an error. Please try again.")

    async def _survey_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /survey command"""
        try:
            if not context.args:
                await update.message.reply_text(
                    "Please provide a trip ID: /survey <trip_id>\n"
                    "Get the trip ID from your trip organizer."
                )
                return

            trip_id = context.args[0]

            # Link user to Telegram ID
            telegram_id = str(update.effective_user.id)
            user = self._get_or_link_user(telegram_id, update.effective_user.username)

            if not user:
                await update.message.reply_text(
                    "❌ Unable to link your Telegram account. "
                    "Please make sure you have a PackVote account first."
                )
                return

            # Validate trip access
            if not self._validate_trip_access(user.id, trip_id):
                await update.message.reply_text(
                    "❌ You don't have access to this trip or the trip doesn't exist. "
                    "Please check the trip ID with your organizer."
                )
                return

            # Start survey
            await self._start_survey(update, context, user.id, trip_id)

        except Exception as e:
            logger.error(f"Error in survey command: {str(e)}")
            await update.message.reply_text("Sorry, I encountered an error. Please try again.")

    async def _status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /status command"""
        try:
            telegram_id = str(update.effective_user.id)
            user = self._get_or_link_user(telegram_id, update.effective_user.username)

            if not user:
                await update.message.reply_text(
                    "❌ Please complete your PackVote profile first or use /start to get started."
                )
                return

            # Get user's trips and survey status
            trips_status = self._get_user_trips_status(user.id)

            if not trips_status:
                await update.message.reply_text(
                    "📝 You haven't been invited to any trips yet, "
                    "or you haven't joined any trips."
                )
                return

            status_message = "📊 Your Survey Status:\n\n"
            for trip_status in trips_status:
                trip_name = trip_status['trip_title']
                completed = trip_status['completed_sections']
                total = trip_status['total_sections']
                percentage = (completed / total * 100) if total > 0 else 0

                status_message += f"🗓️ {trip_name}\n"
                status_message += f"Progress: {completed}/{total} sections ({percentage:.0f}%)\n"

                if percentage == 100:
                    status_message += "✅ Survey complete!\n"
                else:
                    status_message += f"Use /survey {trip_status['trip_id']} to continue\n"
                status_message += "\n"

            await update.message.reply_text(status_message)

        except Exception as e:
            logger.error(f"Error in status command: {str(e)}")
            await update.message.reply_text("Sorry, I encountered an error. Please try again.")

    async def _callback_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle button callbacks"""
        try:
            query = update.callback_query
            await query.answer()

            callback_data = query.data
            if not callback_data:
                return

            # Parse callback data
            parts = callback_data.split(':')
            if len(parts) < 3:
                return

            action, user_id, trip_id = parts[0], parts[1], parts[2]

            # Verify user
            telegram_id = str(update.effective_user.id)
            user = self._get_user_by_telegram_id(telegram_id)

            if not user or str(user.id) != user_id:
                await query.edit_message_text("❌ Invalid user access")
                return

            # Handle different actions
            if action == "start_survey":
                await self._show_survey_section(query, user_id, trip_id, "budget")
            elif action.startswith("section_"):
                section = action.replace("section_", "")
                next_section = self._get_next_section(section)
                if next_section:
                    await self._show_survey_section(query, user_id, trip_id, next_section)
                else:
                    await self._complete_survey(query, user_id, trip_id)
            elif action.startswith("budget_"):
                await self._handle_budget_response(query, user_id, trip_id, callback_data)
            elif action.startswith("vibe_"):
                await self._handle_vibe_response(query, user_id, trip_id, callback_data)

        except Exception as e:
            logger.error(f"Error in callback handler: {str(e)}")

    async def _message_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle text messages"""
        try:
            # Store user responses for survey questions
            message_text = update.message.text
            telegram_id = str(update.effective_user.id)

            # Check if user is in the middle of a survey
            user = self._get_user_by_telegram_id(telegram_id)
            if not user:
                return

            # Handle different survey responses based on context
            # This would be expanded based on the current survey state

        except Exception as e:
            logger.error(f"Error in message handler: {str(e)}")

    def _get_or_link_user(self, telegram_id: str, telegram_username: str = None) -> Optional[User]:
        """Get or link user by Telegram ID"""
        try:
            # First try to find user by Telegram ID
            user = self.db.query(User).filter(User.telegram_id == telegram_id).first()
            if user:
                return user

            # If not found, we can't automatically create users via Telegram
            # User must first register through the web app
            return None

        except Exception as e:
            logger.error(f"Error getting/linking user: {str(e)}")
            return None

    def _get_user_by_telegram_id(self, telegram_id: str) -> Optional[User]:
        """Get user by Telegram ID"""
        try:
            return self.db.query(User).filter(User.telegram_id == telegram_id).first()
        except Exception as e:
            logger.error(f"Error getting user by Telegram ID: {str(e)}")
            return None

    def _validate_trip_access(self, user_id: str, trip_id: str) -> bool:
        """Validate user has access to trip"""
        try:
            participant = self.db.query(Participant).filter(
                Participant.trip_id == trip_id,
                Participant.user_id == user_id,
                Participant.status == "joined"
            ).first()
            return participant is not None
        except Exception as e:
            logger.error(f"Error validating trip access: {str(e)}")
            return False

    async def _start_survey(self, update: Update, context: ContextTypes.DEFAULT_TYPE, user_id: str, trip_id: str):
        """Start the preference survey"""
        try:
            # Check if user already has survey data
            existing_preferences = self.db.query(Preference).filter(
                Preference.trip_id == trip_id,
                Preference.user_id == user_id
            ).all()

            existing_types = {pref.preference_type.value for pref in existing_preferences}

            # Create welcome message
            keyboard = [
                [InlineKeyboardButton("🚀 Start Survey", callback_data=f"start_survey:{user_id}:{trip_id}")]
            ]

            if existing_types:
                keyboard.append([
                    InlineKeyboardButton("📊 View Progress", callback_data=f"status:{user_id}:{trip_id}")
                ])

            reply_markup = InlineKeyboardMarkup(keyboard)

            welcome_text = f"""
📝 Welcome to your PackVote Survey!

This survey helps us understand your preferences for the upcoming trip.
It only takes 2-3 minutes and helps us suggest perfect destinations.

You'll be asked about:
• Budget preferences
• Travel dates
• Activities you enjoy
• Accommodation style
• Transportation preferences
• Trip vibe

Ready to get started?
            """

            await update.message.reply_text(welcome_text, reply_markup=reply_markup)

        except Exception as e:
            logger.error(f"Error starting survey: {str(e)}")
            await update.message.reply_text("Sorry, I couldn't start the survey. Please try again.")

    async def _show_survey_section(self, query, user_id: str, trip_id: str, section: str):
        """Show a specific section of the survey"""
        try:
            if section == "budget":
                await self._show_budget_survey(query, user_id, trip_id)
            elif section == "vibe":
                await self._show_vibe_survey(query, user_id, trip_id)
            # Add other sections as needed

        except Exception as e:
            logger.error(f"Error showing survey section: {str(e)}")

    async def _show_budget_survey(self, query, user_id: str, trip_id: str):
        """Show budget preference survey"""
        try:
            keyboard = [
                [
                    InlineKeyboardButton("$500-1,000", callback_data=f"budget_500_1000:{user_id}:{trip_id}"),
                    InlineKeyboardButton("$1,000-2,000", callback_data=f"budget_1000_2000:{user_id}:{trip_id}")
                ],
                [
                    InlineKeyboardButton("$2,000-3,000", callback_data=f"budget_2000_3000:{user_id}:{trip_id}"),
                    InlineKeyboardButton("$3,000+", callback_data=f"budget_3000_plus:{user_id}:{trip_id}")
                ]
            ]

            reply_markup = InlineKeyboardMarkup(keyboard)

            budget_text = """
💰 Budget Preferences

What's your ideal budget per person for this trip?

This helps us find destinations that match your financial comfort zone.
All estimates include accommodation, food, activities, and local transportation.
            """

            await query.edit_message_text(budget_text, reply_markup=reply_markup)

        except Exception as e:
            logger.error(f"Error showing budget survey: {str(e)}")

    async def _show_vibe_survey(self, query, user_id: str, trip_id: str):
        """Show vibe preference survey"""
        try:
            keyboard = [
                [
                    InlineKeyboardButton("🏖️ Relaxation", callback_data=f"vibe_relaxation:{user_id}:{trip_id}"),
                    InlineKeyboardButton("🎭 Culture", callback_data=f"vibe_culture:{user_id}:{trip_id}")
                ],
                [
                    InlineKeyboardButton("🏔️ Adventure", callback_data=f"vibe_adventure:{user_id}:{trip_id}"),
                    InlineKeyboardButton("🌃 Nightlife", callback_data=f"vibe_nightlife:{user_id}:{trip_id}")
                ],
                [
                    InlineKeyboardButton("🍽️ Foodie", callback_data=f"vibe_foodie:{user_id}:{trip_id}"),
                    InlineKeyboardButton("📸 Photography", callback_data=f"vibe_photography:{user_id}:{trip_id}")
                ]
            ]

            reply_markup = InlineKeyboardMarkup(keyboard)

            vibe_text = """
✨ Trip Vibe

What's your ideal trip vibe?

This helps us match you with destinations and activities that suit your style.
You can select multiple options that appeal to you!
            """

            await query.edit_message_text(vibe_text, reply_markup=reply_markup)

        except Exception as e:
            logger.error(f"Error showing vibe survey: {str(e)}")

    def _get_next_section(self, current_section: str) -> Optional[str]:
        """Get the next survey section"""
        sections = ["budget", "dates", "activities", "accommodation", "transportation", "vibe"]
        try:
            current_index = sections.index(current_section)
            if current_index + 1 < len(sections):
                return sections[current_index + 1]
        except ValueError:
            pass
        return None

    async def _complete_survey(self, query, user_id: str, trip_id: str):
        """Complete the survey"""
        try:
            completion_text = """
🎉 Survey Complete!

Thank you for completing your preference survey. Your responses will help us:

• Generate personalized destination recommendations
• Match you with compatible group preferences
• Suggest activities and accommodations that suit your style

Your trip organizer will notify you when recommendations are ready.
Keep an eye out for voting invitations!

Use /status anytime to check your progress on other trips.
            """

            await query.edit_message_text(completion_text)

        except Exception as e:
            logger.error(f"Error completing survey: {str(e)}")

    def _get_user_trips_status(self, user_id: str) -> List[Dict[str, Any]]:
        """Get survey status for all user's trips"""
        try:
            # Get trips where user is a participant
            trips = self.db.query(Trip, Participant).join(
                Participant, Trip.id == Participant.trip_id
            ).filter(
                Participant.user_id == user_id,
                Participant.status == "joined"
            ).all()

            trips_status = []
            for trip, participant in trips:
                # Get completed preference sections
                preferences = self.db.query(Preference).filter(
                    Preference.trip_id == trip.id,
                    Preference.user_id == user_id
                ).all()

                completed_types = {pref.preference_type.value for pref in preferences}
                total_sections = len(PreferenceType)
                completed_sections = len(completed_types)

                trips_status.append({
                    "trip_id": str(trip.id),
                    "trip_title": trip.title,
                    "completed_sections": completed_sections,
                    "total_sections": total_sections
                })

            return trips_status

        except Exception as e:
            logger.error(f"Error getting user trips status: {str(e)}")
            return []

    async def send_survey_invitation(self, user: User, trip_id: str):
        """Send survey invitation to user via Telegram"""
        try:
            if not user.telegram_id or not self.application:
                return False

            message = f"""
📋 Trip Survey Invitation!

You've been invited to complete a preference survey for a trip on PackVote.

Your responses will help generate perfect destination recommendations for your group.

Use this command to start:
/survey {trip_id}

Or use /status to see all your pending surveys.
            """

            await self.application.bot.send_message(
                chat_id=user.telegram_id,
                text=message
            )
            return True

        except Exception as e:
            logger.error(f"Error sending survey invitation: {str(e)}")
            return False

    async def send_voting_notification(self, user: User, trip_title: str):
        """Send voting notification to user"""
        try:
            if not user.telegram_id or not self.application:
                return False

            message = f"""
🗳️ Voting Time!

Trip recommendations are ready for: {trip_title}

Cast your ranked-choice vote to help decide on the perfect destination!
Log in to PackVote to see the options and vote.

Voting ensures everyone's preferences are heard fairly.
            """

            await self.application.bot.send_message(
                chat_id=user.telegram_id,
                text=message
            )
            return True

        except Exception as e:
            logger.error(f"Error sending voting notification: {str(e)}")
            return False

    def run_bot(self):
        """Start the bot (for development/testing)"""
        if self.application:
            self.application.run_polling()

    def setup_webhook(self):
        """Setup webhook for production deployment"""
        if self.application and settings.TELEGRAM_WEBHOOK_URL:
            self.application.bot.set_webhook(settings.TELEGRAM_WEBHOOK_URL)