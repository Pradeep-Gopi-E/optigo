from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any

from ..schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse, UserUpdate
from ..services.auth import AuthService
from ..utils.database import get_db
from ..models import User

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user.
    """
    auth_service = AuthService(db)
    return auth_service.get_current_user(token)

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Register a new user.
    """
    auth_service = AuthService(db)
    return auth_service.register_user(
        email=user_data.email,
        name=user_data.name,
        password=user_data.password,
        location=user_data.location
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
) -> Any:
    """
    Login with email and password (JSON).
    """
    auth_service = AuthService(db)
    return auth_service.authenticate_user(
        email=login_data.email,
        password=login_data.password
    )

@router.post("/token", response_model=TokenResponse)
async def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    Login with form data (compatible with Swagger UI).
    """
    auth_service = AuthService(db)
    return auth_service.authenticate_user(
        email=form_data.username,  # OAuth2 form uses 'username' field
        password=form_data.password
    )

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user profile.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_users_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update current user profile.
    """
    auth_service = AuthService(db)
    return auth_service.update_user_profile(
        user_id=str(current_user.id),
        name=user_update.name,
        telegram_id=user_update.telegram_id,
        location=user_update.location,
        preferred_currency=user_update.preferred_currency
    )
