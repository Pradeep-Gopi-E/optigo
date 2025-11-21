from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
import uuid

from ..schemas.preference import (
    PreferenceCreate, PreferenceUpdate, PreferenceResponse, SurveyResponse,
    CompleteSurveyRequest, PreferenceType
)
from ..services.auth import AuthService
from ..models import Preference, User
from ..utils.database import get_db
from ..api.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trips/{trip_id}/preferences", tags=["preferences"])


def validate_access(trip_id: str, current_user, db: Session) -> bool:
    """Validate user has access to trip preferences"""
    try:
        auth_service = AuthService(db)
        return auth_service.check_trip_access(current_user, trip_id, "member")
    except Exception:
        return False


@router.get("/", response_model=List[PreferenceResponse])
async def get_trip_preferences(
    trip_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all preferences for a trip"""
    try:
        # Validate UUID
        try:
            uuid.UUID(trip_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Check access
        if not validate_access(trip_id, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this trip"
            )

        # Get preferences with user names
        preferences = db.query(Preference, User).join(
            User, Preference.user_id == User.id
        ).filter(Preference.trip_id == trip_id).all()

        preference_responses = []
        for preference, user in preferences:
            preference_response = PreferenceResponse(
                id=str(preference.id),
                trip_id=str(preference.trip_id),
                user_id=str(preference.user_id),
                preference_type=preference.preference_type.value,
                preference_data=preference.preference_data,
                created_at=preference.created_at,
                updated_at=preference.updated_at,
                user_name=user.name
            )
            preference_responses.append(preference_response)

        return preference_responses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trip preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve preferences"
        )


@router.post("/", response_model=PreferenceResponse, status_code=status.HTTP_201_CREATED)
async def create_preference(
    trip_id: str,
    preference_data: PreferenceCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update a preference for the trip"""
    try:
        # Validate UUID
        try:
            uuid.UUID(trip_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Check access
        if not validate_access(trip_id, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this trip"
            )

        # Check if preference already exists for this user and type
        existing_preference = db.query(Preference).filter(
            Preference.trip_id == trip_id,
            Preference.user_id == str(current_user.id),
            Preference.preference_type == preference_data.preference_type
        ).first()

        if existing_preference:
            # Update existing preference
            existing_preference.preference_data = preference_data.preference_data
            existing_preference.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_preference)
            preference = existing_preference
        else:
            # Create new preference
            new_preference = Preference(
                trip_id=trip_id,
                user_id=str(current_user.id),
                preference_type=preference_data.preference_type,
                preference_data=preference_data.preference_data
            )
            db.add(new_preference)
            db.commit()
            db.refresh(new_preference)
            preference = new_preference

        preference_response = PreferenceResponse(
            id=str(preference.id),
            trip_id=str(preference.trip_id),
            user_id=str(preference.user_id),
            preference_type=preference.preference_type.value,
            preference_data=preference.preference_data,
            created_at=preference.created_at,
            updated_at=preference.updated_at,
            user_name=current_user.name
        )

        return preference_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating preference: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create preference"
        )


@router.put("/{preference_id}", response_model=PreferenceResponse)
async def update_preference(
    trip_id: str,
    preference_id: str,
    preference_update: PreferenceUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a preference"""
    try:
        # Validate UUIDs
        try:
            uuid.UUID(trip_id)
            uuid.UUID(preference_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preference not found"
            )

        # Get preference
        preference = db.query(Preference).filter(
            Preference.id == preference_id,
            Preference.trip_id == trip_id,
            Preference.user_id == str(current_user.id)
        ).first()

        if not preference:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preference not found"
            )

        # Check access
        if not validate_access(trip_id, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this trip"
            )

        # Update preference
        if preference_update.preference_data is not None:
            preference.preference_data = preference_update.preference_data
            preference.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(preference)

        preference_response = PreferenceResponse(
            id=str(preference.id),
            trip_id=str(preference.trip_id),
            user_id=str(preference.user_id),
            preference_type=preference.preference_type.value,
            preference_data=preference.preference_data,
            created_at=preference.created_at,
            updated_at=preference.updated_at,
            user_name=current_user.name
        )

        return preference_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating preference: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preference"
        )


@router.get("/survey", response_model=SurveyResponse)
async def get_my_survey(
    trip_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's preference survey for a trip"""
    try:
        # Validate UUID
        try:
            uuid.UUID(trip_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Check access
        if not validate_access(trip_id, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this trip"
            )

        # Get user's preferences
        user_preferences = db.query(Preference).filter(
            Preference.trip_id == trip_id,
            Preference.user_id == str(current_user.id)
        ).all()

        preference_responses = []
        completion_status = {}

        # Check completion for each preference type
        for pref_type in PreferenceType:
            completion_status[pref_type.value] = False

        for preference in user_preferences:
            preference_response = PreferenceResponse(
                id=str(preference.id),
                trip_id=str(preference.trip_id),
                user_id=str(preference.user_id),
                preference_type=preference.preference_type.value,
                preference_data=preference.preference_data,
                created_at=preference.created_at,
                updated_at=preference.updated_at,
                user_name=current_user.name
            )
            preference_responses.append(preference_response)
            completion_status[preference.preference_type.value] = True

        overall_complete = all(completion_status.values())

        survey_response = SurveyResponse(
            trip_id=trip_id,
            user_preferences=preference_responses,
            completion_status=completion_status,
            overall_complete=overall_complete
        )

        return survey_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting survey: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve survey"
        )


@router.post("/survey", response_model=SurveyResponse)
async def complete_survey(
    trip_id: str,
    survey_data: CompleteSurveyRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete or update preference survey in bulk"""
    try:
        # Validate UUID
        try:
            uuid.UUID(trip_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Check access
        if not validate_access(trip_id, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this trip"
            )

        logger.info(f"Received survey completion request for trip {trip_id} from user {current_user.id}")
        logger.info(f"Survey data keys: {survey_data.model_dump().keys()}")

        created_preferences = []

        # Process each preference type
        preference_mappings = {
            "budget": survey_data.budget,
            "dates": survey_data.dates,
            "activities": survey_data.activities,
            "accommodation": survey_data.accommodation,
            "transportation": survey_data.transportation,
            "vibe": survey_data.vibe,
            "detailed": survey_data.detailed
        }

        for pref_type_str, pref_data in preference_mappings.items():
            if pref_data is not None:
                preference_type = PreferenceType(pref_type_str)

                # Check if preference already exists
                existing_preference = db.query(Preference).filter(
                    Preference.trip_id == trip_id,
                    Preference.user_id == str(current_user.id),
                    Preference.preference_type == preference_type
                ).first()

                pref_data_dict = pref_data.model_dump()

                if existing_preference:
                    # Update existing
                    existing_preference.preference_data = pref_data_dict
                    existing_preference.updated_at = datetime.utcnow()
                    preference = existing_preference
                else:
                    # Create new
                    preference = Preference(
                        trip_id=trip_id,
                        user_id=str(current_user.id),
                        preference_type=preference_type,
                        preference_data=pref_data_dict
                    )
                    db.add(preference)

                db.commit()
                db.refresh(preference)

                preference_response = PreferenceResponse(
                    id=str(preference.id),
                    trip_id=str(preference.trip_id),
                    user_id=str(preference.user_id),
                    preference_type=preference.preference_type.value,
                    preference_data=preference.preference_data,
                    created_at=preference.created_at,
                    updated_at=preference.updated_at,
                    user_name=current_user.name
                )
                created_preferences.append(preference_response)

        # Return updated survey status
        completion_status = {}
        for pref_type_str in preference_mappings.keys():
            completion_status[pref_type_str] = preference_mappings[pref_type_str] is not None

        overall_complete = all(completion_status.values())

        survey_response = SurveyResponse(
            trip_id=trip_id,
            user_preferences=created_preferences,
            completion_status=completion_status,
            overall_complete=overall_complete
        )

        return survey_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing survey: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete survey"
        )