from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from ..schemas.trip import TripCreate, TripUpdate, TripResponse, TripDetailResponse, InviteRequest
from ..schemas.participant import ParticipantResponse, ParticipantRole, ParticipantStatus
from ..services.auth import AuthService
from ..models import Trip, Participant, User, ParticipantRole as ParticipantRoleModel, ParticipantStatus as ParticipantStatusModel
from ..utils.database import get_db
from ..api.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("/", response_model=List[TripResponse])
async def get_user_trips(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all trips for the current user"""
    try:
        # Get trips where user is creator or participant
        trips_query = db.query(Trip).filter(
            (Trip.created_by == str(current_user.id)) |
            (Trip.participants.any(user_id=str(current_user.id), status="joined"))
        ).order_by(Trip.created_at.desc()).offset(skip).limit(limit)

        trips = trips_query.all()

        trip_responses = []
        for trip in trips:
            participant_count = db.query(Participant).filter(
                Participant.trip_id == trip.id,
                Participant.status == "joined"
            ).count()

            trip_response = TripResponse(
                id=str(trip.id),
                title=trip.title,
                description=trip.description,
                destination=trip.destination,
                start_date=trip.start_date,
                end_date=trip.end_date,
                budget_min=float(trip.budget_min) if trip.budget_min else None,
                budget_max=float(trip.budget_max) if trip.budget_max else None,
                status=trip.status.value,
                created_by=str(trip.created_by),
                created_at=trip.created_at,
                updated_at=trip.updated_at,
                participant_count=participant_count
            )
            trip_responses.append(trip_response)

        return trip_responses

    except Exception as e:
        logger.error(f"Error getting user trips: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve trips"
        )


@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_data: TripCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new trip"""
    try:
        # Validate dates
        if trip_data.start_date and trip_data.end_date:
            if trip_data.start_date >= trip_data.end_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Start date must be before end date"
                )

        # Validate budget
        if trip_data.budget_min and trip_data.budget_max:
            if trip_data.budget_min >= trip_data.budget_max:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Minimum budget must be less than maximum budget"
                )

        # Create trip
        new_trip = Trip(
            title=trip_data.title,
            description=trip_data.description,
            destination=trip_data.destination,
            start_date=trip_data.start_date,
            end_date=trip_data.end_date,
            budget_min=trip_data.budget_min,
            budget_max=trip_data.budget_max,
            created_by=str(current_user.id)
        )

        db.add(new_trip)
        db.commit()
        db.refresh(new_trip)

        # Add creator as owner participant
        owner_participant = Participant(
            trip_id=str(new_trip.id),
            user_id=str(current_user.id),
            role=ParticipantRole.owner,
            status=ParticipantStatus.joined,
            joined_at=datetime.utcnow()
        )
        db.add(owner_participant)
        db.commit()

        trip_response = TripResponse(
            id=str(new_trip.id),
            title=new_trip.title,
            description=new_trip.description,
            destination=new_trip.destination,
            start_date=new_trip.start_date,
            end_date=new_trip.end_date,
            budget_min=float(new_trip.budget_min) if new_trip.budget_min else None,
            budget_max=float(new_trip.budget_max) if new_trip.budget_max else None,
            status=new_trip.status.value,
            created_by=str(new_trip.created_by),
            created_at=new_trip.created_at,
            updated_at=new_trip.updated_at,
            participant_count=1
        )

        return trip_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating trip: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create trip"
        )


@router.get("/{trip_id}", response_model=TripDetailResponse)
async def get_trip(
    trip_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trip details"""
    try:
        # Validate UUID
        try:
            uuid.UUID(trip_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Get trip
        trip = db.query(Trip).filter(Trip.id == trip_id).first()

        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Check access
        auth_service = AuthService(db)
        if not auth_service.check_trip_access(current_user, trip_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this trip"
            )

        # Get participants
        participants = db.query(Participant, User).join(
            User, Participant.user_id == User.id
        ).filter(Participant.trip_id == trip_id).all()

        participant_responses = []
        for participant, user in participants:
            participant_response = ParticipantResponse(
                id=str(participant.id),
                trip_id=str(participant.trip_id),
                user_id=str(participant.user_id),
                role=participant.role.value,
                status=participant.status.value,
                invited_at=participant.invited_at,
                joined_at=participant.joined_at,
                user_name=user.name,
                user_email=user.email
            )
            participant_responses.append(participant_response)

        trip_detail = TripDetailResponse(
            id=str(trip.id),
            title=trip.title,
            description=trip.description,
            destination=trip.destination,
            start_date=trip.start_date,
            end_date=trip.end_date,
            budget_min=float(trip.budget_min) if trip.budget_min else None,
            budget_max=float(trip.budget_max) if trip.budget_max else None,
            status=trip.status.value,
            created_by=str(trip.created_by),
            created_at=trip.created_at,
            updated_at=trip.updated_at,
            participants=participant_responses
        )

        return trip_detail

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trip details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve trip details"
        )


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: str,
    trip_update: TripUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update trip details"""
    try:
        # Validate UUID
        try:
            uuid.UUID(trip_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Get trip
        trip = db.query(Trip).filter(Trip.id == trip_id).first()

        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Check owner access
        if str(trip.created_by) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only trip owners can update trip details"
            )

        # Validate dates
        if trip_update.start_date and trip_update.end_date:
            if trip_update.start_date >= trip_update.end_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Start date must be before end date"
                )

        # Validate budget
        if trip_update.budget_min and trip_update.budget_max:
            if trip_update.budget_min >= trip_update.budget_max:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Minimum budget must be less than maximum budget"
                )

        # Update fields
        update_data = trip_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(trip, field):
                setattr(trip, field, value)

        db.commit()
        db.refresh(trip)

        # Get participant count
        participant_count = db.query(Participant).filter(
            Participant.trip_id == trip_id,
            Participant.status == "joined"
        ).count()

        trip_response = TripResponse(
            id=str(trip.id),
            title=trip.title,
            description=trip.description,
            destination=trip.destination,
            start_date=trip.start_date,
            end_date=trip.end_date,
            budget_min=float(trip.budget_min) if trip.budget_min else None,
            budget_max=float(trip.budget_max) if trip.budget_max else None,
            status=trip.status.value,
            created_by=str(trip.created_by),
            created_at=trip.created_at,
            updated_at=trip.updated_at,
            participant_count=participant_count
        )

        return trip_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating trip: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update trip"
        )


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a trip"""
    try:
        # Validate UUID
        try:
            uuid.UUID(trip_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Get trip
        trip = db.query(Trip).filter(Trip.id == trip_id).first()

        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Check owner access
        if str(trip.created_by) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only trip owners can delete trips"
            )

        # Delete trip (cascade will handle related records)
        db.delete(trip)
        db.commit()

        return

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting trip: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete trip"
        )


@router.get("/{trip_id}/participants", response_model=List[ParticipantResponse])
async def get_trip_participants(
    trip_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trip participants"""
    try:
        # Check access
        auth_service = AuthService(db)
        if not auth_service.check_trip_access(current_user, trip_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this trip"
            )

        # Get participants
        participants = db.query(Participant, User).join(
            User, Participant.user_id == User.id
        ).filter(Participant.trip_id == trip_id).all()

        participant_responses = []
        for participant, user in participants:
            participant_response = ParticipantResponse(
                id=str(participant.id),
                trip_id=str(participant.trip_id),
                user_id=str(participant.user_id),
                role=participant.role.value,
                status=participant.status.value,
                invited_at=participant.invited_at,
                joined_at=participant.joined_at,
                user_name=user.name,
                user_email=user.email
            )
            participant_responses.append(participant_response)

        return participant_responses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trip participants: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve trip participants"
        )