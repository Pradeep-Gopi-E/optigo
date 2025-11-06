from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid

from ..schemas.vote import VoteCreate, BulkVoteCreate, VoteResponse, VotingResult, UserVoteSummary
from ..services.auth import AuthService
from ..services.voting import VotingService
from ..models import Vote, Recommendation, User, Trip, Participant
from ..utils.database import get_db
from ..api.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trips/{trip_id}/votes", tags=["voting"])


def validate_access(trip_id: str, current_user, db: Session) -> bool:
    """Validate user has access to trip voting"""
    try:
        auth_service = AuthService(db)
        return auth_service.check_trip_access(current_user, trip_id, "member")
    except Exception:
        return False


@router.get("/", response_model=List[VoteResponse])
async def get_trip_votes(
    trip_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all votes for a trip (for transparency)"""
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

        # Get votes with recommendation details
        votes = db.query(Vote, Recommendation, User).join(
            Recommendation, Vote.recommendation_id == Recommendation.id
        ).join(
            User, Vote.user_id == User.id
        ).filter(Vote.trip_id == trip_id).order_by(
            Vote.user_id, Vote.rank
        ).all()

        vote_responses = []
        for vote, recommendation, user in votes:
            vote_response = VoteResponse(
                id=str(vote.id),
                trip_id=str(vote.trip_id),
                user_id=str(vote.user_id),
                recommendation_id=str(vote.recommendation_id),
                rank=vote.rank,
                created_at=vote.created_at,
                destination_name=recommendation.destination_name
            )
            vote_responses.append(vote_response)

        return vote_responses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trip votes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve votes"
        )


@router.post("/", response_model=List[VoteResponse])
async def cast_votes(
    trip_id: str,
    vote_data: BulkVoteCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cast ranked-choice votes for recommendations"""
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

        # Validate vote data format
        vote_list = []
        for vote_item in vote_data.votes:
            vote_list.append({
                "recommendation_id": vote_item.recommendation_id,
                "rank": vote_item.rank
            })

        # Cast vote using voting service
        voting_service = VotingService(db)
        success = voting_service.cast_vote(
            user_id=str(current_user.id),
            trip_id=trip_id,
            vote_data=vote_list
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to cast vote. Please check your vote data."
            )

        # Return updated votes for this user
        user_votes = db.query(Vote, Recommendation).join(
            Recommendation, Vote.recommendation_id == Recommendation.id
        ).filter(
            Vote.trip_id == trip_id,
            Vote.user_id == str(current_user.id)
        ).order_by(Vote.rank).all()

        vote_responses = []
        for vote, recommendation in user_votes:
            vote_response = VoteResponse(
                id=str(vote.id),
                trip_id=str(vote.trip_id),
                user_id=str(vote.user_id),
                recommendation_id=str(vote.recommendation_id),
                rank=vote.rank,
                created_at=vote.created_at,
                destination_name=recommendation.destination_name
            )
            vote_responses.append(vote_response)

        return vote_responses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error casting votes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cast votes"
        )


@router.get("/results", response_model=VotingResult)
async def get_voting_results(
    trip_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get instant-runoff voting results"""
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

        # Calculate results using voting service
        voting_service = VotingService(db)
        results = voting_service.calculate_results(trip_id)

        return VotingResult(**results)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting voting results: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate voting results"
        )


@router.get("/my-votes", response_model=List[VoteResponse])
async def get_my_votes(
    trip_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's votes for this trip"""
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

        # Get user's votes
        user_votes = db.query(Vote, Recommendation).join(
            Recommendation, Vote.recommendation_id == Recommendation.id
        ).filter(
            Vote.trip_id == trip_id,
            Vote.user_id == str(current_user.id)
        ).order_by(Vote.rank).all()

        vote_responses = []
        for vote, recommendation in user_votes:
            vote_response = VoteResponse(
                id=str(vote.id),
                trip_id=str(vote.trip_id),
                user_id=str(vote.user_id),
                recommendation_id=str(vote.recommendation_id),
                rank=vote.rank,
                created_at=vote.created_at,
                destination_name=recommendation.destination_name
            )
            vote_responses.append(vote_response)

        return vote_responses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user votes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user votes"
        )


@router.get("/summary", response_model=List[UserVoteSummary])
async def get_voting_summary(
    trip_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get summary of who has voted in the trip"""
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

        # Get all participants who have joined
        participants = db.query(Participant, User).join(
            User, Participant.user_id == User.id
        ).filter(
            Participant.trip_id == trip_id,
            Participant.status == "joined"
        ).all()

        # Get vote counts for each participant
        vote_summaries = []
        for participant, user in participants:
            vote_count = db.query(Vote).filter(
                Vote.trip_id == trip_id,
                Vote.user_id == str(user.id)
            ).count()

            has_voted = vote_count > 0

            vote_summary = UserVoteSummary(
                user_id=str(user.id),
                user_name=user.name,
                has_voted=has_voted,
                vote_count=vote_count
            )
            vote_summaries.append(vote_summary)

        return vote_summaries

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting voting summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve voting summary"
        )


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_votes(
    trip_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Withdraw all current user's votes for this trip"""
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

        # Delete user's votes
        deleted_count = db.query(Vote).filter(
            Vote.trip_id == trip_id,
            Vote.user_id == str(current_user.id)
        ).delete()

        db.commit()
        logger.info(f"User {current_user.id} withdrew {deleted_count} votes from trip {trip_id}")

        return

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error withdrawing votes: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to withdraw votes"
        )