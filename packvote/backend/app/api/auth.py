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


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Register a new user"""
    try:
        auth_service = AuthService(db)
        result = auth_service.register_user(
            email=user_data.email,
            name=user_data.name,
            password=user_data.password
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user"
        )


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Authenticate user and return access token"""
    try:
        auth_service = AuthService(db)
        result = auth_service.authenticate_user(
            email=user_data.email,
            password=user_data.password
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to authenticate user"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)) -> Any:
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        telegram_id=current_user.telegram_id,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update current user profile"""
    try:
        auth_service = AuthService(db)
        updated_user = auth_service.update_user_profile(
            user_id=str(current_user.id),
            name=user_update.name,
            telegram_id=user_update.telegram_id
        )
        return UserResponse(
            id=str(updated_user.id),
            email=updated_user.email,
            name=updated_user.name,
            telegram_id=updated_user.telegram_id,
            is_active=updated_user.is_active,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at
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