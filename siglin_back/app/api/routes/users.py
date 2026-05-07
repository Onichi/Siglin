import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from starlette import status
from sqlalchemy.orm import joinedload

from app.db.database import get_db
from app.schemas.user import UserResponse, UserPasswordUpdate
from app.schemas.favorite import FavoriteResponse, FavoriteCreate
from app.db.models import User, UserAchievement, FavoriteGesture, Gesture, UserLesson
from app.api.deps import get_current_user, get_current_admin
from app.schemas.achievement import UserAchievementResponse
from app.core.security import verify_password, get_password_hash

router = APIRouter(prefix="/api/users", tags=["Пользователи"])


# 1. ПОЛУЧЕНИЕ ДАННЫХ ТЕКУЩЕГО ЮЗЕРА
@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


# 2. ОБНОВЛЕННЫЙ ЭНДПОИНТ НАСТРОЕК (ТЕКСТ + АВАТАР)
@router.put("/me/update", response_model=UserResponse)
async def update_user_me(
        username: str = Form(None),
        email: str = Form(None),
        avatar: UploadFile = File(None),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    # Проверка ника на уникальность
    if username and username != current_user.username:
        query = select(User).where(User.username == username)
        result = await db.execute(query)
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Этот никнейм уже занят")
        current_user.username = username

    # Обновление почты
    if email:
        current_user.email = email

    # Логика загрузки аватара (как в твоем upload_avatar)
    if avatar:
        if not avatar.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Разрешены только изображения")

        if current_user.avatar_url:
            old_file_path = current_user.avatar_url.lstrip("/")
            if os.path.exists(old_file_path):
                os.remove(old_file_path)

        file_extension = avatar.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        os.makedirs("static/avatars", exist_ok=True)
        file_path = f"static/avatars/{unique_filename}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(avatar.file, buffer)

        current_user.avatar_url = f"/static/avatars/{unique_filename}"

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


# 3. ДОСТИЖЕНИЯ
@router.get("/me/achievements", response_model=List[UserAchievementResponse])
async def get_users_achievements(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    query = (
        select(UserAchievement)
        .where(UserAchievement.user_id == current_user.id)
        .options(joinedload(UserAchievement.achievement))
    )
    result = await db.execute(query)
    return result.scalars().all()


# 4. СМЕНА ПАРОЛЯ
@router.patch("/me/password")
async def update_password(
        password_data: UserPasswordUpdate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный текущий пароль"
        )
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.add(current_user)
    await db.commit()
    return {'message': "Пароль успешно изменен"}


# 5. УДАЛЕНИЕ АККАУНТА
@router.delete("/me")
async def delete_user_me(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    if current_user.avatar_url:
        old_file_path = current_user.avatar_url.lstrip("/")
        if os.path.exists(old_file_path):
            os.remove(old_file_path)

    await db.delete(current_user)
    await db.commit()
    return {'message': "Аккаунт успешно удалён"}


# 6. ИЗБРАННЫЕ ЖЕСТЫ (POST, DELETE, GET)
@router.post("/me/favorites", response_model=FavoriteResponse)
async def add_favorite_gesture(
        favorite_data: FavoriteCreate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    query = select(Gesture).where(Gesture.id == favorite_data.gesture_id)
    result = await db.execute(query)
    gesture = result.scalars().first()

    if not gesture:
        raise HTTPException(status_code=404, detail="Жест не найден в справочнике")

    existing_favorite_query = select(FavoriteGesture).where(
        FavoriteGesture.user_id == current_user.id,
        FavoriteGesture.gesture_id == favorite_data.gesture_id
    )
    existing_favorite_result = await db.execute(existing_favorite_query)
    if existing_favorite_result.scalars().first():
        raise HTTPException(status_code=400, detail="Этот жест уже находится в избранном")

    new_favorite = FavoriteGesture(user_id=current_user.id, gesture_id=favorite_data.gesture_id)
    db.add(new_favorite)
    await db.commit()
    await db.refresh(new_favorite)
    new_favorite.gesture = gesture
    return new_favorite


@router.delete("/me/favorites/{gesture_id}")
async def remove_favorite_gesture(
        gesture_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    query = select(FavoriteGesture).where(
        FavoriteGesture.user_id == current_user.id,
        FavoriteGesture.gesture_id == gesture_id
    )
    result = await db.execute(query)
    favorite = result.scalars().first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Жест не найден в избранном")
    await db.delete(favorite)
    await db.commit()
    return {"message": "Жест удален из избранного"}


@router.get("/me/favorites", response_model=List[FavoriteResponse])
async def get_favorite_gestures(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    query = (
        select(FavoriteGesture)
        .where(FavoriteGesture.user_id == current_user.id)
        .options(joinedload(FavoriteGesture.gesture))
    )
    result = await db.execute(query)
    return result.scalars().all()


# 7. УРОКИ
@router.get("/me/lessons", response_model=List[int])
async def get_user_completed_lessons(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    query = select(UserLesson.lesson_id).where(UserLesson.user_id == current_user.id)
    result = await db.execute(query)
    return result.scalars().all()


# 8. ВСПОМОГАТЕЛЬНЫЕ ДЛЯ АВАТАРА (ОСТАВИЛ ИЗ ТВОЕГО КОДА)
@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar_standalone(
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Разрешены только изображения")
    if current_user.avatar_url:
        old_file_path = current_user.avatar_url.lstrip("/")
        if os.path.exists(old_file_path):
            os.remove(old_file_path)

    unique_filename = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}"
    file_path = f"static/avatars/{unique_filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    current_user.avatar_url = f"/static/avatars/{unique_filename}"
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/me/avatar", response_model=UserResponse)
async def delete_avatar(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    if current_user.avatar_url:
        old_file_path = current_user.avatar_url.lstrip("/")
        if os.path.exists(old_file_path):
            os.remove(old_file_path)
        current_user.avatar_url = None
        await db.commit()
        await db.refresh(current_user)
    return current_user

@router.get("/all", response_model=List[UserResponse])
async def get_all_users(
        current_admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    query = select(User).order_by(User.id.desc())
    result = await db.execute(query)
    return result.scalars().all()