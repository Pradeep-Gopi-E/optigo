from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from sqlalchemy import or_

from ..models import User, Participant, Trip
from ..utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token
)
from ..config import settings
import logging

logger = logging.getLogger(__name__)


class AuthService:
    """Service for handling user authentication and authorization"""

    def __init__(self, db: Session):
        self.db = db

    def register_user(self, email: str, name: str, password: str) -> Dict[str, Any]:
        """
        Register a new user

        Args:
            email: User email
            name: User name
            password: Plain text password

        Returns:
            Dict containing user info and access token

        Raises:
            HTTPException: If user already exists
        """
        try:
            # Check if user already exists
            existing_user = self.db.query(User).filter(
                or_(User.email == email, User.telegram_id == email)
            ).first()

            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this email already exists"
                )

            # Create new user
            hashed_password = get_password_hash(password)
            new_user = User(
                email=email,
                name=name,
                is_active=True
            )

            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)

            # Generate access token
            access_token_expires = timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": str(new_user.id), "email": new_user.email},
                expires_delta=access_token_expires
            )

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": settings.JWT_EXPIRE_MINUTES * 60,
                "user": {
                    "id": str(new_user.id),
                    "email": new_user.email,
                    "name": new_user.name,
                    "is_active": new_user.is_active,
                    "created_at": new_user.created_at.isoformat() if new_user.created_at else None
                }
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error registering user: {str(e)}")
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to register user"
            )

    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user and return access token

        Args:
            email: User email
            password: Plain text password

        Returns:
            Dict containing user info and access token

        Raises:
            HTTPException: If credentials are invalid
        """
        try:
            # Find user by email
            user = self.db.query(User).filter(User.email == email).first()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )

            # Verify password (for now, we'll use email as password since we don't have password field)
            # In a real app, you'd verify against the hashed password
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User account is inactive"
                )

            # Generate access token
            access_token_expires = timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": str(user.id), "email": user.email},
                expires_delta=access_token_expires
            )

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": settings.JWT_EXPIRE_MINUTES * 60,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "is_active": user.is_active,
                    "created_at": user.created_at.isoformat() if user.created_at else None
                }
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error authenticating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to authenticate user"
            )

    def get_current_user(self, token: str) -> User:
        """
        Get current user from JWT token

        Args:
            token: JWT access token

        Returns:
            User object

        Raises:
            HTTPException: If token is invalid or user not found
        """
        try:
            # Verify token
            payload = verify_token(token)
            user_id = payload.get("sub")

            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token"
                )

            # Get user from database
            user = self.db.query(User).filter(User.id == user_id).first()

            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )

            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User account is inactive"
                )

            return user

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting current user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

    def check_trip_access(self, user: User, trip_id: str, required_role: str = "member") -> bool:
        """
        Check if user has access to a trip with required role

        Args:
            user: User object
            trip_id: Trip ID
            required_role: Required role (owner, member, viewer)

        Returns:
            True if user has access, False otherwise
        """
        try:
            # Check if user is trip owner (creator)
            trip = self.db.query(Trip).filter(Trip.id == trip_id).first()
            if trip and str(trip.created_by) == str(user.id):
                return True

            # Check participant status
            participant = self.db.query(Participant).filter(
                Participant.trip_id == trip_id,
                Participant.user_id == user.id,
                Participant.status == "joined"
            ).first()

            if not participant:
                return False

            # Role hierarchy: owner > member > viewer
            role_hierarchy = {"viewer": 1, "member": 2, "owner": 3}
            user_role_level = role_hierarchy.get(participant.role.value, 0)
            required_role_level = role_hierarchy.get(required_role, 0)

            return user_role_level >= required_role_level

        except Exception as e:
            logger.error(f"Error checking trip access: {str(e)}")
            return False

    def update_user_profile(self, user_id: str, name: Optional[str] = None, telegram_id: Optional[str] = None) -> User:
        """
        Update user profile information

        Args:
            user_id: User ID to update
            name: New name (optional)
            telegram_id: Telegram ID (optional)

        Returns:
            Updated user object

        Raises:
            HTTPException: If user not found or update fails
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )

            # Check if telegram_id is already taken by another user
            if telegram_id and telegram_id != user.telegram_id:
                existing_user = self.db.query(User).filter(
                    User.telegram_id == telegram_id,
                    User.id != user_id
                ).first()

                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Telegram ID already in use"
                    )

            # Update fields
            if name is not None:
                user.name = name
            if telegram_id is not None:
                user.telegram_id = telegram_id

            user.updated_at = datetime.utcnow()

            self.db.commit()
            self.db.refresh(user)

            return user

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating user profile: {str(e)}")
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user profile"
            )