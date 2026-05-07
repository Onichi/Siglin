from pydantic import BaseModel
from typing import Optional

class Gesture(BaseModel):
    name: str
    description: Optional[str] = None
    gif_url: Optional[str] = None

class GestureCreate(Gesture):
    name: str
    description: Optional[str] = None

class GestureUpdate(BaseModel):
    name: str
    description: Optional[str] = None
    gif_url: Optional[str] = None

class GestureResponse(Gesture):
    id: int

    class Config:
        from_attributes = True

