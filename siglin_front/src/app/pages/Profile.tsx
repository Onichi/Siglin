import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Settings, Flame, Trophy, BookOpen, Target, Award } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAppStore, DEFAULT_GESTURE_PLACEHOLDER } from '../store/useAppStore';

export function Profile() {
  const navigate = useNavigate();

  // Достаем данные пользователя и прогресс из глобального стора
  const { userData, completedLessonIds, lessons } = useAppStore();

  // Расчет статистики
  const completedCount = completedLessonIds.length;
  const totalLessons = lessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const avatarImage = userData?.avatar_url || DEFAULT_GESTURE_PLACEHOLDER;

  return (
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto w-full space-y-8">

        {/* Шапка профиля */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden"
        >
          {/* Фоновое свечение */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          {/* Аватар */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#0a0a0a] overflow-hidden bg-zinc-800 relative z-10 shadow-xl">
              <ImageWithFallback
                  src={avatarImage}
                  alt={userData.username}
                  className="w-full h-full object-cover"
              />
            </div>
            {/* Бейдж уровня поверх аватара */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-zinc-800 border-2 border-[#0a0a0a] text-white px-4 py-1 rounded-full font-bold text-sm z-20 shadow-lg flex items-center gap-1.5 whitespace-nowrap">
              <Trophy size={14} className="text-green-500" />
              Уровень {userData.level || 1}
            </div>
          </div>

          {/* Информация */}
          <div className="flex-1 text-center md:text-left z-10 mt-2 md:mt-0">
            <h1 className="font-['Manrope'] text-3xl md:text-4xl font-bold text-white mb-2">
              {userData.username}
            </h1>
            <p className="text-zinc-400 mb-6 flex items-center justify-center md:justify-start gap-2">
              <Target size={16} />
              {userData.role === 'admin' ? 'Администратор системы' : 'Изучает базовый курс РЖЯ'}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <button
                  onClick={() => navigate('/settings')}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 text-sm"
              >
                <Settings size={16} />
                Редактировать профиль
              </button>
              <button
                  onClick={() => navigate('/profile/achievements')}
                  className="px-5 py-2.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-black font-medium rounded-xl transition-colors flex items-center gap-2 text-sm"
              >
                <Award size={16} />
                Достижения
              </button>
            </div>
          </div>
        </motion.div>

        {/* Сетка статистики */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Карточка 1: Опыт */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Target className="text-blue-500" size={20} />
            </div>
            <div className="text-zinc-500 text-sm font-medium mb-1">Всего опыта (XP)</div>
            <div className="text-2xl font-['Manrope'] font-bold text-white">{userData.xp || 0}</div>
          </motion.div>

          {/* Карточка 2: Серия дней */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 relative z-10">
              <Flame className="text-orange-500" size={20} />
            </div>
            <div className="text-zinc-500 text-sm font-medium mb-1 relative z-10">Ударный режим</div>
            <div className="text-2xl font-['Manrope'] font-bold text-white relative z-10">
              {userData.streak_days || 0} <span className="text-lg text-zinc-500 font-normal">дней</span>
            </div>
            {/* Декоративное пламя, если стрик > 0 */}
            {(userData.streak_days || 0) > 0 && (
                <Flame size={100} className="absolute -bottom-6 -right-6 text-orange-500/5 rotate-12" />
            )}
          </motion.div>

          {/* Карточка 3: Пройденные уроки */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
              <BookOpen className="text-green-500" size={20} />
            </div>
            <div className="text-zinc-500 text-sm font-medium mb-1">Пройдено уроков</div>
            <div className="text-2xl font-['Manrope'] font-bold text-white">
              {completedCount} <span className="text-lg text-zinc-500 font-normal">из {totalLessons}</span>
            </div>
          </motion.div>

          {/* Карточка 4: Общий прогресс курса */}
          {/* Карточка 4: Общий прогресс курса */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col">

            {/* 1. Иконка стоит отдельно, как у всех остальных карточек (с mb-4) */}
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
              <BookOpen className="text-green-500" size={20} />
            </div>

            {/* 2. Текст и проценты раскидываем по краям, прижимаем к низу */}
            <div className="flex items-end justify-between mb-3 mt-auto">
              <div className="text-zinc-500 text-sm font-medium">Прогресс курса</div>
              <div className="text-xl font-['Manrope'] font-bold text-white leading-none">
                {progressPercent}<span className="text-green-500">%</span>
              </div>
            </div>

            {/* 3. Полоса прогресса */}
            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-green-500 rounded-full"
              />
            </div>

          </motion.div>

        </div>
      </div>
  );
}