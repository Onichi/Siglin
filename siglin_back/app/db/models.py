from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Date, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    #Данные для авторизации
    email: Mapped[str] = mapped_column(String(150), index=True, unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), index=True,unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String, default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()  # База сама подставит время создания
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    theme: Mapped[str] = mapped_column(String, default="system")
    save_history: Mapped[bool] = mapped_column(Boolean, default=True)
    ui_language: Mapped[str] = mapped_column(String, default="ru")

    # Геймификациооные параметры
    level: Mapped[int] = mapped_column(default=1)
    xp: Mapped[int] = mapped_column(default=0)
    streak_days: Mapped[int] = mapped_column(default=0)
    last_active_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    total_gestures: Mapped[int] = mapped_column(default=0)

    achievements: Mapped[List["UserAchievement"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    favorites: Mapped[List["FavoriteGesture"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    completed_lessons: Mapped[List["UserLesson"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    description: Mapped[str] = mapped_column(String)
    icon_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    reward_xp: Mapped[int] = mapped_column(default=50)

    users: Mapped[List["UserAchievement"]] = relationship(back_populates="achievement", cascade="all, delete-orphan")

class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id : Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id", ondelete="CASCADE"))
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="achievements")
    achievement: Mapped["Achievement"] = relationship(back_populates="users")


class Gesture(Base):
    __tablename__ = "gestures"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True) # Само слово: "Спасибо"
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Описание движений
    gif_url: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Ссылка на обучающую анимацию

    # Кто добавил этот жест в избранное
    favorited_by: Mapped[List["FavoriteGesture"]] = relationship(
        back_populates="gesture",
        cascade="all, delete-orphan"
    )

# --- Личный словарь (Связь Юзера и Жеста) ---
class FavoriteGesture(Base):
    __tablename__ = "favorite_gestures"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    gesture_id: Mapped[int] = mapped_column(ForeignKey("gestures.id", ondelete="CASCADE")) # <--- Теперь тут ID из справочника
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="favorites")
    gesture: Mapped["Gesture"] = relationship(back_populates="favorited_by")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cover_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # Порядок самого урока в курсе (Урок 1, Урок 2 и т.д.)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)  # Чтобы админ мог скрыть недоделанный урок

    gestures_count: Mapped[int] = mapped_column(Integer, default=0)

    # Связи
    # Связь с жестами урока (с сортировкой по порядку)
    gestures: Mapped[List["LessonGesture"]] = relationship(
        back_populates="lesson",
        cascade="all, delete-orphan",
        order_by="LessonGesture.order_index"  # Алхимия сама отсортирует жесты при запросе!
    )
    user_progress: Mapped[List["UserLesson"]] = relationship(
        back_populates="lesson",
        cascade="all, delete-orphan"
    )


# --- Связующая таблица: Жесты внутри Урока ---
class LessonGesture(Base):
    __tablename__ = "lesson_gestures"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))
    gesture_id: Mapped[int] = mapped_column(ForeignKey("gestures.id", ondelete="CASCADE"))

    # Тот самый "Блок" — порядковый номер жеста внутри конкретного урока
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    # Связи
    lesson: Mapped["Lesson"] = relationship(back_populates="gestures")
    gesture: Mapped["Gesture"] = relationship()  # Ссылка на карточку жеста из справочника


# --- Прогресс пользователей (Пройденные уроки) ---
class UserLesson(Base):
    __tablename__ = "user_lessons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))

    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Связи
    user: Mapped["User"] = relationship(back_populates="completed_lessons")
    lesson: Mapped["Lesson"] = relationship(back_populates="user_progress")