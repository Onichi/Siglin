from pydantic import BaseModel
from typing import List, Optional
from app.schemas.gesture import GestureResponse # Импортируем карточку жеста

# --- Вспомогательные схемы для связи жеста и урока ---
class LessonGestureCreate(BaseModel):
    gesture_id: int
    order_index: int # Порядковый номер в уроке (1, 2, 3...)

class LessonGestureResponse(BaseModel):
    id: int
    order_index: int
    gesture: GestureResponse # Полная карточка жеста (с названием и гифкой)

    class Config:
        from_attributes = True

class LessonCompleteResponse(BaseModel):
    message: str
    lesson_id: int
    level: int
    xp: int
    xp_gained: int
    leveled_up: bool

    class Config:
        from_attributes = True

# --- Схемы самого урока ---
class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    order_index: int = 0
    is_published: bool = False
    gestures_count: int = 0

class LessonCreate(LessonBase):
    pass

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    is_published: Optional[bool] = None
    cover_url: Optional[str] = None

# Схема ответа: Урок + вложенный отсортированный список его жестов
class LessonResponse(LessonBase):
    id: int
    cover_url: Optional[str] = None
    class Config:
        from_attributes = True

class LessonDetailResponse(LessonResponse):
    gestures: List[LessonGestureResponse] = []
