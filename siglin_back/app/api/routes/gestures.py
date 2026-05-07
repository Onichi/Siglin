import uuid
import shutil
import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import Gesture
from app.schemas.gesture import GestureCreate, GestureUpdate, GestureResponse
from app.api.deps import get_current_admin

router = APIRouter()


# 1. Получить весь справочник (Доступно всем)
@router.get("/", response_model=List[GestureResponse])
async def get_all_gestures(db: AsyncSession = Depends(get_db)):
    query = select(Gesture).order_by(Gesture.name)
    result = await db.execute(query)
    return result.scalars().all()


# 2. ШАГ 1: Создать жест (Только текст/JSON)
@router.post("/", response_model=GestureResponse, status_code=status.HTTP_201_CREATED)
async def create_gesture(
        gesture_in: GestureCreate,
        current_admin=Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # Проверяем на дубликаты
    query = select(Gesture).where(Gesture.name == gesture_in.name)
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Жест с таким названием уже существует")

    new_gesture = Gesture(**gesture_in.model_dump())
    db.add(new_gesture)
    await db.commit()
    await db.refresh(new_gesture)
    return new_gesture


# 3. Обновить текстовые данные жеста
@router.patch("/{gesture_id}", response_model=GestureResponse)
async def update_gesture(
        gesture_id: int,
        gesture_in: GestureUpdate,
        current_admin=Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    query = select(Gesture).where(Gesture.id == gesture_id)
    result = await db.execute(query)
    gesture = result.scalars().first()

    if not gesture:
        raise HTTPException(status_code=404, detail="Жест не найден")

    update_data = gesture_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(gesture, field, value)

    await db.commit()
    await db.refresh(gesture)
    return gesture


# 4. ШАГ 2: Загрузить гифку/видео для уже созданного жеста
@router.post("/{gesture_id}/media", response_model=GestureResponse)
async def upload_gesture_media(
        gesture_id: int,
        file: UploadFile = File(...),
        current_admin=Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    query = select(Gesture).where(Gesture.id == gesture_id)
    result = await db.execute(query)
    gesture = result.scalars().first()

    if not gesture:
        raise HTTPException(status_code=404, detail="Жест не найден")

    if not file.content_type.startswith(("image/", "video/")):
        raise HTTPException(status_code=400, detail="Разрешены только изображения и видео")

    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"static/media/{unique_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    gesture.gif_url = f"/static/media/{unique_filename}"

    await db.commit()
    await db.refresh(gesture)

    return gesture


# 5. Удалить жест
@router.delete("/{gesture_id}", status_code=status.HTTP_200_OK)
async def delete_gesture(
        gesture_id: int,
        current_admin=Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    query = select(Gesture).where(Gesture.id == gesture_id)
    result = await db.execute(query)
    gesture = result.scalars().first()

    if not gesture:
        raise HTTPException(status_code=404, detail="Жест не найден")

    if gesture.gif_url:
        file_path = gesture.gif_url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)

    await db.delete(gesture)
    await db.commit()
    return {"message": "Жест успешно удален"}