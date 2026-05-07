import os
import uuid
import shutil
from datetime import date
from fastapi import UploadFile, File

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import joinedload
from typing import List

from app.db.database import get_db
from app.db.models import Lesson, LessonGesture, UserLesson, User
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse, LessonGestureCreate, LessonDetailResponse, LessonCompleteResponse
from app.api.deps import get_current_admin, get_current_user

router = APIRouter()


@router.get("/", response_model=List[LessonResponse])
async def get_lessons(db: AsyncSession = Depends(get_db)):
    """
    Получить список всех уроков вместе с их жестами.
    """
    query = select(Lesson).order_by(Lesson.order_index)
    result = await db.execute(query)
    # Алхимия сама удалит дубликаты строк при джоинах благодаря .unique()
    return result.scalars().unique().all()


@router.post("/", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    lesson_in: LessonCreate,
    current_admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Создать пустой урок (Только для Админов).
    """
    new_lesson = Lesson(**lesson_in.model_dump())
    db.add(new_lesson)
    await db.commit()

    # --- ИСПРАВЛЕНИЕ ---
    # Вместо обычного db.refresh() запрашиваем свежесозданный урок из базы
    # сразу с прикрепленными связями (joinedload), чтобы Pydantic не ругался.
    query = (
        select(Lesson)
        .where(Lesson.id == new_lesson.id)
        .options(joinedload(Lesson.gestures).joinedload(LessonGesture.gesture))
    )
    result = await db.execute(query)

    return result.scalars().unique().first()


# --- САМЫЙ ВАЖНЫЙ РОУТ ДЛЯ ФРОНТЕНДА ---
@router.put("/{lesson_id}/gestures", response_model=LessonDetailResponse)
async def sync_lesson_gestures(
        lesson_id: int,
        gestures_in: List[LessonGestureCreate],  # Принимаем массив жестов!
        current_admin=Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    """
    Прикрепить жесты к уроку.
    Фронтенд присылает полный массив блоков урока, а бэкенд их синхронизирует.
    """
    # 1. Проверяем, существует ли урок
    query = select(Lesson).where(Lesson.id == lesson_id)
    result = await db.execute(query)
    lesson = result.scalars().first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")

    # 2. Удаляем все старые жесты из этого урока (очищаем холст)
    await db.execute(delete(LessonGesture).where(LessonGesture.lesson_id == lesson_id))

    # 3. Записываем новые жесты с их порядковыми номерами
    for item in gestures_in:
        new_link = LessonGesture(
            lesson_id=lesson_id,
            gesture_id=item.gesture_id,
            order_index=item.order_index
        )
        db.add(new_link)
    lesson.gestures_count = len(gestures_in)
    db.add(lesson)
    await db.commit()

    # 4. Возвращаем обновленный урок со всеми связями
    refresh_query = (
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(joinedload(Lesson.gestures).joinedload(LessonGesture.gesture))
    )
    result = await db.execute(refresh_query)
    return result.scalars().unique().first()

@router.patch("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
        lesson_id: int,
        lesson_in: LessonUpdate,
        current_admin=Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    """Обновить информацию об уроке (название, описание, статус)"""
    query = select(Lesson).where(Lesson.id == lesson_id)
    result = await db.execute(query)
    lesson = result.scalars().first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")

    # exclude_unset=True обновляет только те поля, которые были переданы
    update_data = lesson_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lesson, field, value)

    await db.commit()
    await db.refresh(lesson)
    return lesson

@router.delete("/{lesson_id}", status_code=status.HTTP_200_OK)
async def delete_lesson(
        lesson_id: int,
        current_admin=Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    """Удалить урок (Только для Админов)"""
    query = select(Lesson).where(Lesson.id == lesson_id)
    result = await db.execute(query)
    lesson = result.scalars().first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")

    if lesson.cover_url:
        file_path = lesson.cover_url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)

    await db.delete(lesson)
    await db.commit()
    return {"message": "Урок успешно удален"}

@router.get("/{lesson_id}", response_model=LessonDetailResponse)
async def get_lesson_by_id(lesson_id: int, db: AsyncSession = Depends(get_db)):
    """
    Получить КОНКРЕТНЫЙ урок со всеми его жестами (для страницы прохождения).
    """
    query = (
        select(Lesson)
        .where(Lesson.id == lesson_id)
        # А вот тут загружаем жесты, потому что юзер зашел внутрь урока!
        .options(joinedload(Lesson.gestures).joinedload(LessonGesture.gesture))
    )
    result = await db.execute(query)
    lesson = result.scalars().unique().first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")

    return lesson


@router.post("/{lesson_id}/complete", response_model=LessonCompleteResponse)
async def complete_lesson(
        lesson_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Отметить урок как пройденный и начислить XP/уровень.
    """
    lesson_query = select(Lesson).where(Lesson.id == lesson_id)
    lesson_result = await db.execute(lesson_query)
    lesson = lesson_result.scalars().first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")

    progress_query = select(UserLesson).where(
        UserLesson.user_id == current_user.id,
        UserLesson.lesson_id == lesson_id,
    )
    progress_result = await db.execute(progress_query)
    existing_progress = progress_result.scalars().first()

    if existing_progress:
        return LessonCompleteResponse(
            message="Урок уже был пройден",
            lesson_id=lesson_id,
            level=current_user.level,
            xp=current_user.xp,
            xp_gained=0,
            leveled_up=False,
        )

    xp_gained = 100
    current_user.xp += xp_gained
    leveled_up = False

    while current_user.xp >= current_user.level * 100:
        current_user.xp -= current_user.level * 100
        current_user.level += 1
        leveled_up = True

    new_progress = UserLesson(
        user_id=current_user.id,
        lesson_id=lesson_id,
    )
    db.add(new_progress)
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return LessonCompleteResponse(
        message="Урок успешно пройден",
        lesson_id=lesson_id,
        level=current_user.level,
        xp=current_user.xp,
        xp_gained=xp_gained,
        leveled_up=leveled_up,
    )


@router.post("/{lesson_id}/cover", response_model=LessonDetailResponse)
async def upload_lesson_cover(
        lesson_id: int,
        file: UploadFile = File(...),
        current_admin=Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    """
    Загрузить или заменить обложку для урока (Только для Админов).
    """
    # 1. Ищем урок
    query = (
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(joinedload(Lesson.gestures).joinedload(LessonGesture.gesture))
    )
    result = await db.execute(query)
    lesson = result.scalars().unique().first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")

    # 2. Проверяем формат файла
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Разрешены только изображения")

    # 3. Удаляем старую обложку с диска, если она была
    if lesson.cover_url:
        old_file_path = lesson.cover_url.lstrip("/")  # Убираем первый слэш, чтобы путь стал относительным
        if os.path.exists(old_file_path):
            os.remove(old_file_path)

    # 4. Генерируем имя и сохраняем новую картинку по относительному пути
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"static/lessons/{unique_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 5. Обновляем базу данных
    lesson.cover_url = f"/static/lessons/{unique_filename}"

    await db.commit()
    await db.refresh(lesson)

    return lesson
