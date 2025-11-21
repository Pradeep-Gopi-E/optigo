@router.post("/join/{invite_code}", response_model=JoinTripResponse)
async def join_trip_by_code(
    invite_code: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a trip using an invite code"""
    try:
        # Find trip by invite code
        trip = db.query(Trip).filter(Trip.invite_code == invite_code).first()
        
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid invite code"
            )
        
        # Check if user is already a participant
        existing_participant = db.query(Participant).filter(
            Participant.trip_id == trip.id,
            Participant.user_id == str(current_user.id)
        ).first()
        
        if existing_participant:
            return JoinTripResponse(
                message="You are already a participant in this trip",
                trip_id=str(trip.id),
                trip_title=trip.title
            )
        
        # Add user as participant
        new_participant = Participant(
            trip_id=str(trip.id),
            user_id=str(current_user.id),
            role=ParticipantRoleModel.member,
            status=ParticipantStatusModel.joined,
            joined_at=datetime.utcnow()
        )
        
        db.add(new_participant)
        db.commit()
        
        return JoinTripResponse(
            message="Successfully joined the trip!",
            trip_id=str(trip.id),
            trip_title=trip.title
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining trip: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join trip"
        )
