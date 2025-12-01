from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import secrets
import logging

from ..schemas.trip import TripCreate, TripUpdate, TripResponse, TripDetailResponse, InviteRequest, JoinTripResponse
from ..schemas.participant import ParticipantResponse, ParticipantRole, ParticipantStatus
from ..services.auth import AuthService
from ..models import Trip, Participant, User, Vote
from ..models.trip import TripStatus
from ..models.participant import ParticipantRole as ParticipantRoleModel, ParticipantStatus as ParticipantStatusModel
from ..utils.database import get_db
from ..api.auth import get_current_user

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
            (Trip.created_by == current_user.id) |
            (Trip.participants.any(user_id=current_user.id, status="joined"))
        ).order_by(Trip.created_at.desc()).offset(skip).limit(limit)

        trips = trips_query.all()
        return trips

    except Exception as e:
        logger.error(f"Error fetching trips: {str(e)}")
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
                    detail="Budget min must be less than budget max"
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
            expected_participants=trip_data.expected_participants,
            created_by=current_user.id,
            invite_code=secrets.token_urlsafe(8),
            status=TripStatus.planning,
            allow_member_recommendations=trip_data.allow_member_recommendations,
            allow_member_edits=trip_data.allow_member_edits,
            image_url=trip_data.image_url
        )
        
        db.add(new_trip)
        db.commit()
        db.refresh(new_trip)

        # Add creator as participant
        participant = Participant(
            trip_id=new_trip.id,
            user_id=current_user.id,
            role=ParticipantRoleModel.owner,
            status=ParticipantStatusModel.joined,
            joined_at=datetime.utcnow()
        )
        db.add(participant)
        db.commit()

        return new_trip

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
            expected_participants=trip.expected_participants,
            invite_code=trip.invite_code,
            status=trip.status.value,
            allow_member_recommendations=trip.allow_member_recommendations,
            allow_member_edits=trip.allow_member_edits,
            created_by=str(trip.created_by),
            created_at=trip.created_at,
            updated_at=trip.updated_at,
            participants=participant_responses,
            image_url=trip.image_url
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

        # Update fields
        for field, value in trip_update.dict(exclude_unset=True).items():
            setattr(trip, field, value)
            
        db.commit()
        db.refresh(trip)
        return trip

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


@router.delete("/{trip_id}/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_participant(
    trip_id: str,
    participant_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a participant from a trip (or leave trip)"""
    try:
        # Validate UUIDs
        try:
            uuid.UUID(trip_id)
            uuid.UUID(participant_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid ID format"
            )

        # Get participant
        participant = db.query(Participant).filter(
            Participant.id == participant_id,
            Participant.trip_id == trip_id
        ).first()

        if not participant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participant not found"
            )

        # Get trip
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Check permissions
        is_owner = str(trip.created_by) == str(current_user.id)
        is_self = str(participant.user_id) == str(current_user.id)

        if not (is_owner or is_self):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only remove yourself or participants from your own trips"
            )

        # If owner is leaving, we might want to warn or handle ownership transfer
        # For now, we allow it as requested, but log it.
        if is_owner and is_self:
            logger.warning(f"Owner {current_user.id} is leaving trip {trip_id}")

        # Remove participant
        db.delete(participant)
        
        # Also remove their votes
        db.query(Vote).filter(
            Vote.trip_id == trip_id,
            Vote.user_id == participant.user_id
        ).delete()

        db.commit()
        
        return

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing participant: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove participant"
        )


@router.put("/{trip_id}/participants/{participant_id}/role", response_model=ParticipantResponse)
async def update_participant_role(
    trip_id: str,
    participant_id: str,
    role: ParticipantRole,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a participant's role (e.g. promote to admin)"""
    try:
        # Validate UUIDs
        try:
            uuid.UUID(trip_id)
            uuid.UUID(participant_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid ID format"
            )

        # Get trip
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Only owner can change roles
        if str(trip.created_by) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only trip owners can manage participant roles"
            )

        # Get participant
        participant = db.query(Participant).filter(
            Participant.id == participant_id,
            Participant.trip_id == trip_id
        ).first()

        if not participant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participant not found"
            )
            
        # Prevent changing owner's role (if they are in the participants list)
        if str(participant.user_id) == str(trip.created_by):
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change role of the trip owner"
            )

        # Update role
        # Map schema enum to model enum
        if role == ParticipantRole.admin:
            participant.role = ParticipantRoleModel.admin
        elif role == ParticipantRole.member:
            participant.role = ParticipantRoleModel.member
        elif role == ParticipantRole.viewer:
            participant.role = ParticipantRoleModel.viewer
        else:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )

        db.commit()
        db.refresh(participant)

        # Get user info for response
        user = db.query(User).filter(User.id == participant.user_id).first()

        return ParticipantResponse(
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

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating participant role: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update participant role"
        )