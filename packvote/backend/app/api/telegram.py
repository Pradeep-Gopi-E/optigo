from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging

from ..services.auth import AuthService
from ..services.telegram_bot import TelegramBotService
from ..models import User, Participant, Trip
from ..models.participant import ParticipantStatus
from ..utils.database import get_db
from ..api.auth import get_current_user
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telegram", tags=["telegram"])


@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Telegram bot webhook"""
    try:
        # Get webhook data
        webhook_data = await request.json()
        logger.info(f"Received Telegram webhook: {webhook_data}")

        # Initialize bot service
        bot_service = TelegramBotService(db)

        # Process the update
        if bot_service.application:
            update = bot_service.application.update_queue.put(webhook_data)
            return {"status": "ok"}
        else:
            logger.warning("Telegram bot not initialized")
            return {"status": "error", "message": "Bot not initialized"}

    except Exception as e:
        logger.error(f"Error processing Telegram webhook: {str(e)}")
        return {"status": "error", "message": str(e)}


@router.post("/send-survey-invitation")
async def send_survey_invitation(
    request_data: Dict[str, Any],
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send survey invitation to trip participants"""
    try:
        trip_id = request_data.get("trip_id")
        if not trip_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="trip_id is required"
            )

        # Validate trip ownership
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        if str(trip.created_by) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only trip owners can send survey invitations"
            )

        # Get participants with Telegram IDs
        participants = db.query(Participant, User).join(
            User, Participant.user_id == User.id
        ).filter(
            Participant.trip_id == trip_id,
            Participant.status == ParticipantStatus.joined,
            User.telegram_id.isnot(None)
        ).all()

        if not participants:
            return {
                "message": "No participants with linked Telegram accounts found",
                "invitations_sent": 0
            }

        # Initialize bot service
        bot_service = TelegramBotService(db)

        # Send invitations
        sent_count = 0
        for participant, user in participants:
            try:
                success = await bot_service.send_survey_invitation(user, trip_id)
                if success:
                    sent_count += 1
            except Exception as e:
                logger.error(f"Error sending invitation to user {user.id}: {str(e)}")

        return {
            "message": f"Survey invitations sent to {sent_count} participants",
            "invitations_sent": sent_count,
            "total_participants": len(participants)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending survey invitations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send survey invitations"
        )


@router.post("/send-voting-notification")
async def send_voting_notification(
    request_data: Dict[str, Any],
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send voting notification to trip participants"""
    try:
        trip_id = request_data.get("trip_id")
        if not trip_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="trip_id is required"
            )

        # Validate trip ownership
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        if str(trip.created_by) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only trip owners can send voting notifications"
            )

        # Get participants with Telegram IDs
        participants = db.query(Participant, User).join(
            User, Participant.user_id == User.id
        ).filter(
            Participant.trip_id == trip_id,
            Participant.status == ParticipantStatus.joined,
            User.telegram_id.isnot(None)
        ).all()

        if not participants:
            return {
                "message": "No participants with linked Telegram accounts found",
                "notifications_sent": 0
            }

        # Initialize bot service
        bot_service = TelegramBotService(db)

        # Send notifications
        sent_count = 0
        for participant, user in participants:
            try:
                success = await bot_service.send_voting_notification(user, trip.title)
                if success:
                    sent_count += 1
            except Exception as e:
                logger.error(f"Error sending notification to user {user.id}: {str(e)}")

        return {
            "message": f"Voting notifications sent to {sent_count} participants",
            "notifications_sent": sent_count,
            "total_participants": len(participants)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending voting notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send voting notifications"
        )


@router.get("/participants-stats/{trip_id}")
async def get_telegram_participants_stats(
    trip_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics about participants with linked Telegram accounts"""
    try:
        # Validate trip access
        auth_service = AuthService(db)
        if not auth_service.check_trip_access(current_user, trip_id, "owner"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only trip owners can view participant statistics"
            )

        # Get all participants
        all_participants = db.query(Participant, User).join(
            User, Participant.user_id == User.id
        ).filter(
            Participant.trip_id == trip_id,
            Participant.status == ParticipantStatus.joined
        ).all()

        # Count participants with and without Telegram
        with_telegram = 0
        without_telegram = 0

        for participant, user in all_participants:
            if user.telegram_id:
                with_telegram += 1
            else:
                without_telegram += 1

        return {
            "trip_id": trip_id,
            "total_participants": len(all_participants),
            "with_telegram": with_telegram,
            "without_telegram": without_telegram,
            "telegram_coverage_percentage": (with_telegram / len(all_participants) * 100) if all_participants else 0
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting participant stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve participant statistics"
        )


@router.get("/bot-info")
async def get_bot_info():
    """Get information about the Telegram bot configuration"""
    try:
        from ..config import settings

        return {
            "bot_configured": bool(settings.TELEGRAM_BOT_TOKEN),
            "webhook_configured": bool(settings.TELEGRAM_WEBHOOK_URL),
            "features": {
                "surveys": True,
                "voting_notifications": True,
                "status_updates": True
            }
        }

    except Exception as e:
        logger.error(f"Error getting bot info: {str(e)}")
        return {
            "bot_configured": False,
            "error": str(e)
        }