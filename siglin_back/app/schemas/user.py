from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, date

from app.db.models import Achievement


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=150)
    theme: Optional[str] = None
    save_history: Optional[bool] = None
    ui_language: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    avatar_url: Optional[str] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None

    theme:str
    save_history: bool
    ui_language: str

    level: int
    xp: int
    streak_days: int
    last_active_date: Optional[date] = None
    total_gestures: int

    class Config:
        from_attributes = True

class UserPasswordUpdate(BaseModel):
    old_password: str
    new_password: str