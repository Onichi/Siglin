from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AchievementBase(BaseModel):
    id: int
    name: str
    description: str
    icon_url: Optional[str] = None
    reward_xp: int

    class Config:
        from_attributes = True

class UserAchievementResponse(BaseModel):
    earned_at: datetime
    achievement: AchievementBase

    class Config:
        from_attributes = True
