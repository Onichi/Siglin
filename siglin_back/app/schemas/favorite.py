from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schemas.gesture import GestureResponse

# 2. Схема: что присылает фронтенд (нажал на звездочку у жеста №5)
class FavoriteCreate(BaseModel):
    gesture_id: int

# 3. Схема ответа (отдаем дату добавления и всю информацию о жесте)
class FavoriteResponse(BaseModel):
    id: int
    added_at: datetime
    gesture: GestureResponse # Вкладываем карточку жеста внутрь

    class Config:
        from_attributes = True