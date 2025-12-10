from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ..schemas.recommendation import RecommendationCreate, RecommendationResponse, GenerateRecommendationsResponse, RecommendationUpdate
from ..services.auth import AuthService
from ..services.ai_service import AIService
from ..services.voting import VotingService
from ..services.unsplash_service import unsplash_service
from ..models import Recommendation, Trip, Vote
from ..utils.database import get_db
from ..api.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trips/{trip_id}/recommendations", tags=["recommendations"])


def validate_access(trip_id: str, current_user, db: Session) -> bool:
    """Validate user has access to trip recommendations"""
    try:
        auth_service = AuthService(db)
        return auth_service.check_trip_access(current_user, trip_id, "member")
    except Exception:
        return False


@router.get("/", response_model=List[RecommendationResponse])
async def get_trip_recommendations(
    trip_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all recommendations for a trip"""
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

        # Get recommendations
        recommendations = db.query(Recommendation).filter(
            Recommendation.trip_id == trip_id
        ).order_by(Recommendation.created_at.desc()).all()

        recommendation_responses = []
        for rec in recommendations:
            # Check for personalization for current user
            personalization = None
            if rec.meta and "personalizations" in rec.meta:
                user_id = str(current_user.id)
                if user_id in rec.meta["personalizations"]:
                    personalization = rec.meta["personalizations"][user_id]

            recommendation_response = RecommendationResponse(
                id=str(rec.id),
                trip_id=str(rec.trip_id),
                destination_name=rec.destination_name,
                description=rec.description,
                estimated_cost=float(rec.estimated_cost) if rec.estimated_cost else None,
                activities=rec.activities,
                accommodation_options=rec.accommodation_options,
                transportation_options=rec.meta.get("transportation_options", []) if rec.meta else [],
                ai_generated=rec.ai_generated,
                image_url=rec.image_url,
                created_at=rec.created_at,
                personalization=personalization,
                meta=rec.meta
            )
            recommendation_responses.append(recommendation_response)

        return recommendation_responses

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recommendations"
        )


@router.post("/generate", response_model=GenerateRecommendationsResponse)
async def generate_ai_recommendations(
    trip_id: str,
    clear_existing: bool = True,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate AI-powered recommendations for the trip"""
    try:
        # Validate UUID
        try:
            uuid.UUID(trip_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Check if user is trip owner or has elevated permissions
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Only trip owners can generate recommendations
        if str(trip.created_by) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only trip owners can generate recommendations"
            )

        # Check access
        if not validate_access(trip_id, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this trip"
            )

        # Clear existing AI recommendations if requested
        if clear_existing:
            # Step 1: Delete Votes associated with AI recommendations for this trip
            # We need to find the IDs of recommendations that will be deleted
            ai_recs_query = db.query(Recommendation.id).filter(
                Recommendation.trip_id == trip_id,
                Recommendation.ai_generated == True
            )
            
            # Delete votes for these recommendations
            db.query(Vote).filter(
                Vote.recommendation_id.in_(ai_recs_query)
            ).delete(synchronize_session=False)

            # Step 2: Delete the recommendations themselves
            db.query(Recommendation).filter(
                Recommendation.trip_id == trip_id,
                Recommendation.ai_generated == True
            ).delete(synchronize_session=False)
            
            db.commit()

        # Generate AI recommendations
        ai_service = AIService(db)
        created_recommendations = await ai_service.generate_recommendations(trip_id)

        ai_service_available = True  # Track if AI was actually used
        if not created_recommendations:
            logger.warning("No recommendations were generated")
            return GenerateRecommendationsResponse(
                message="No recommendations could be generated. Please check trip preferences.",
                recommendations_generated=0,
                ai_service_available=ai_service_available
            )

        # Reset voting session since new recommendations are available
        voting_service = VotingService(db)
        voting_service.reset_votes(trip_id)

        return GenerateRecommendationsResponse(
            message=f"Successfully generated {len(created_recommendations)} recommendations. Voting session has been reset.",
            recommendations_generated=len(created_recommendations),
            ai_service_available=ai_service_available
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendations"
        )


@router.post("/", response_model=RecommendationResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_recommendation(
    trip_id: str,
    recommendation_data: RecommendationCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a custom recommendation (not AI-generated)"""
    try:
        # Validate UUID
        try:
            uuid.UUID(trip_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Check if user is trip owner or has elevated permissions
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Check permissions
        is_owner = str(trip.created_by) == str(current_user.id)
        
        if not is_owner and not trip.allow_member_recommendations:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only trip owners can create recommendations for this trip"
            )

        # Check access
        if not validate_access(trip_id, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this trip"
            )

        # Create recommendation
        new_recommendation = Recommendation(
            trip_id=trip_id,
            destination_name=recommendation_data.destination_name,
            description=recommendation_data.description,
            estimated_cost=recommendation_data.estimated_cost,
            activities=recommendation_data.activities,
            accommodation_options=recommendation_data.accommodation_options,
            meta={"transportation_options": recommendation_data.transportation_options},
            ai_generated=recommendation_data.ai_generated
        )

        # Fetch image from Unsplash
        image_url = await unsplash_service.get_photo_url(new_recommendation.destination_name)
        if image_url:
            new_recommendation.image_url = image_url

        db.add(new_recommendation)
        db.commit()
        db.refresh(new_recommendation)

        recommendation_response = RecommendationResponse(
            id=str(new_recommendation.id),
            trip_id=str(new_recommendation.trip_id),
            destination_name=new_recommendation.destination_name,
            description=new_recommendation.description,
            estimated_cost=float(new_recommendation.estimated_cost) if new_recommendation.estimated_cost else None,
            activities=new_recommendation.activities,
            accommodation_options=new_recommendation.accommodation_options,
            transportation_options=new_recommendation.meta.get("transportation_options", []) if new_recommendation.meta else [],
            ai_generated=new_recommendation.ai_generated,
            image_url=new_recommendation.image_url,
            created_at=new_recommendation.created_at,
            meta=new_recommendation.meta
        )

        return recommendation_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating recommendation: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create recommendation"
        )


@router.get("/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation(
    trip_id: str,
    recommendation_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific recommendation details"""
    try:
        # Validate UUIDs
        try:
            uuid.UUID(trip_id)
            uuid.UUID(recommendation_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recommendation not found"
            )

        # Check access
        if not validate_access(trip_id, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this trip"
            )

        # Get recommendation
        recommendation = db.query(Recommendation).filter(
            Recommendation.id == recommendation_id,
            Recommendation.trip_id == trip_id
        ).first()

        if not recommendation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recommendation not found"
            )

        # Check for personalization for current user
        personalization = None
        if recommendation.meta and "personalizations" in recommendation.meta:
            user_id = str(current_user.id)
            if user_id in recommendation.meta["personalizations"]:
                personalization = recommendation.meta["personalizations"][user_id]

        recommendation_response = RecommendationResponse(
            id=str(recommendation.id),
            trip_id=str(recommendation.trip_id),
            destination_name=recommendation.destination_name,
            description=recommendation.description,
            estimated_cost=float(recommendation.estimated_cost) if recommendation.estimated_cost else None,
            activities=recommendation.activities,
            accommodation_options=recommendation.accommodation_options,
            transportation_options=recommendation.meta.get("transportation_options", []) if recommendation.meta else [],
            ai_generated=recommendation.ai_generated,
            image_url=recommendation.image_url,
            created_at=recommendation.created_at,
            personalization=personalization,
            meta=recommendation.meta
        )

        return recommendation_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recommendation"
        )


@router.delete("/{recommendation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recommendation(
    trip_id: str,
    recommendation_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a recommendation"""
    try:
        # Validate UUIDs
        try:
            uuid.UUID(trip_id)
            uuid.UUID(recommendation_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recommendation not found"
            )

        # Check if user is trip owner
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found"
            )

        # Only trip owners can delete recommendations
        if str(trip.created_by) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only trip owners can delete recommendations"
            )

        # Get recommendation
        recommendation = db.query(Recommendation).filter(
            Recommendation.id == recommendation_id,
            Recommendation.trip_id == trip_id
        ).first()

        if not recommendation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recommendation not found"
            )

        # Delete recommendation
        db.delete(recommendation)
        db.commit()

        return

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting recommendation: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete recommendation"
        )


@router.post("/{recommendation_id}/personalize", response_model=RecommendationResponse)
async def personalize_recommendation(
    trip_id: str,
    recommendation_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate personalized details for a recommendation based on user location"""
    try:
        # Validate UUIDs
        try:
            uuid.UUID(trip_id)
            uuid.UUID(recommendation_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recommendation not found"
            )

        # Check access
        if not validate_access(trip_id, current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this trip"
            )

        # Get recommendation
        recommendation = db.query(Recommendation).filter(
            Recommendation.id == recommendation_id,
            Recommendation.trip_id == trip_id
        ).first()

        if not recommendation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recommendation not found"
            )

        # Check if user has location
        if not current_user.location:
             # Return without personalization if no location
             return RecommendationResponse(
                id=str(recommendation.id),
                trip_id=str(recommendation.trip_id),
                destination_name=recommendation.destination_name,
                description=recommendation.description,
                estimated_cost=float(recommendation.estimated_cost) if recommendation.estimated_cost else None,
                activities=recommendation.activities,
                accommodation_options=recommendation.accommodation_options,
                transportation_options=recommendation.meta.get("transportation_options", []) if recommendation.meta else [],
                ai_generated=recommendation.ai_generated,
                image_url=recommendation.image_url,
                created_at=recommendation.created_at,
                personalization=None,
                meta=recommendation.meta
            )

        # Generate personalization
        ai_service = AIService(db)
        
        # Determine currency
        currency = current_user.preferred_currency
        if not currency:
            currency_code, _ = ai_service.get_currency_for_location(current_user.location)
            currency = currency_code
            
        personalization_data = await ai_service.generate_personalization(
            destination=recommendation.destination_name,
            user_location=current_user.location,
            currency=currency or "USD"
        )

        # Store in meta
        if not recommendation.meta:
            recommendation.meta = {}
        
        recommendation.meta["personalization"] = personalization_data

        # Force update of meta field (SQLAlchemy sometimes misses JSON updates)
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(recommendation, "meta")
        
        db.commit()
        db.refresh(recommendation)

        # Construct response with personalization
        recommendation_response = RecommendationResponse(
            id=str(recommendation.id),
            trip_id=str(recommendation.trip_id),
            destination_name=recommendation.destination_name,
            description=recommendation.description,
            estimated_cost=float(recommendation.estimated_cost) if recommendation.estimated_cost else None,
            activities=recommendation.activities,
            accommodation_options=recommendation.accommodation_options,
            transportation_options=recommendation.meta.get("transportation_options", []) if recommendation.meta else [],
            ai_generated=recommendation.ai_generated,
            image_url=recommendation.image_url,
            created_at=recommendation.created_at,
            personalization=personalization_data,
            meta=recommendation.meta
        )

        return recommendation_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error personalizing recommendation: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to personalize recommendation"
        )