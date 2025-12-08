from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    location: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    telegram_id: Optional[str] = None
    location: Optional[str] = None
    preferred_currency: Optional[str] = None
    dashboard_theme: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    telegram_id: Optional[str] = None
    location: Optional[str] = None
    preferred_currency: str = "USD"
    dashboard_theme: str = "wilderness"
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse