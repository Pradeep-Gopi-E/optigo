from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..schemas.user import UserCreate, UserLogin, UserUpdate, UserResponse, TokenResponse
from ..services.auth import AuthService
from ..utils.database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Any:
    """Dependency to get current authenticated user"""
    try:
        auth_service = AuthService(db)
        user = auth_service.get_current_user(credentials.credentials)
        return user
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)) -> Any:
    """Register a new user"""
    try:
        auth_service = AuthService(db)
        return auth_service.register_user(
            email=user_data.email,
            name=user_data.name,
            password=user_data.password,
            location=user_data.location
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user"
        )


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)) -> Any:
    """Login user and return token"""
    try:
        auth_service = AuthService(db)
        return auth_service.authenticate_user(
            email=user_data.email,
            password=user_data.password
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to login"
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)) -> Any:
    """Get current user profile"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_data: UserUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update current user profile"""
    try:
        auth_service = AuthService(db)
        return auth_service.update_user_profile(
            user_id=current_user.id,
            name=user_data.name,
            telegram_id=user_data.telegram_id,
            location=user_data.location
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )


@router.post("/logout")
async def logout(current_user = Depends(get_current_user)) -> Dict[str, str]:
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}