import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router';
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Lock,
  Menu,
  X,
  BookA,
  Video,
  Award,
  UserCircle,
  Settings,
  TrendingUp,
  Clock,
  Sparkles,
  HandMetal,
  Target,
  Flame
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAppStore, DEFAULT_GESTURE_PLACEHOLDER } from '../store/useAppStore';

const RECENT_WORDS = [];

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { activeTab?: string } | null;
  const { userData, lessons, completedLessonIds, gestures, recentGestureIds } = useAppStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(state?.activeTab || 'courses');

  const bgEducationImage = "https://images.unsplash.com/photo-1763386599933-5a6fd4bf96d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBkYXJrJTIwbW9kZXJuJTIwZ3JlZW58ZW58MXx8fHwxNzc3NDY3NjMwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
  const DEFAULT_AVATAR = DEFAULT_GESTURE_PLACEHOLDER;

  const avatarImage = userData?.avatar_url || DEFAULT_AVATAR;

  const dayIndex = Math.floor(Date.now() / 86400000);
  // Выбираем жест (остаток от деления гарантирует, что мы не выйдем за пределы массива)
  const gestureOfTheDay = gestures.length > 0 ? gestures[dayIndex % gestures.length] : null;

  const recentGestures = gestures.filter(g => recentGestureIds.includes(g.id)).slice(0, 3);
// Временная заглушка для разработки (если в базе пусто):
  const displayGestures = recentGestures.length > 0 ? recentGestures : gestures.slice(0, 3);

  // Определяем урок для главного баннера (первый непройденный, либо последний доступный)
  const activeLesson = lessons.find(l => !completedLessonIds.includes(l.id)) || lessons[0];
  const totalLessons = lessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercent = totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0;
  const strokeDasharray = 251.2;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * progressPercent) / 100;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-['Inter'] selection:bg-green-500/30 selection:text-green-200 overflow-x-hidden">
      {/* Main Content Area */}
      <main className="min-h-screen flex flex-col relative">
        {/* Top Header */}
        <div className="flex-1 p-4 md:p-8 xl:flex xl:gap-8 max-w-[1600px] mx-auto w-full">

          {/* Left / Center Column: Dynamic View */}
          {activeTab === 'courses' ? (
            <div className="flex-1 space-y-8">

              {/* Hero Banner (Current Lesson) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50"
              >
                <div className="absolute inset-0 opacity-20">
                  <ImageWithFallback
                    src={bgEducationImage}
                    alt="Education Background"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />
                </div>

                {/* Изменено: p-5 для мобилок, flex-row и items-center всегда */}
                <div className="relative p-5 md:p-10 z-10 flex flex-row gap-4 md:gap-8 items-center justify-between">

                  {/* Левая часть с текстом */}
                  <div className="flex-1 min-w-0"> {/* min-w-0 предотвращает выезд текста за границы */}
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] md:text-xs font-semibold tracking-wide uppercase mb-2 md:mb-4">
                      <Sparkles size={12} className="md:w-3.5 md:h-3.5" />
                      Продолжить
                    </div>

                    {/* Ограничиваем название одной строкой на мобилках */}
                    <h1 className="font-['Manrope'] text-lg md:text-4xl font-bold text-white mb-1 md:mb-3 truncate">
                      {activeLesson ? activeLesson.title : 'Загрузка...'}
                    </h1>

                    {/* Скрываем описание на мобилках, чтобы не раздувать блок */}
                    <p className="hidden md:block text-zinc-400 text-base md:text-lg leading-relaxed mb-6">
                      {activeLesson ? (activeLesson.description || 'Описание отсутствует') : ''}
                    </p>

                    {/* Уменьшенная кнопка для мобильных */}
                    <button
                      onClick={() => navigate(`/lesson/${activeLesson.id}`)}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2 md:px-6 md:py-3.5 rounded-lg md:rounded-xl transition-all text-sm md:text-base"
                    >
                      <PlayCircle size={18} className="fill-black/10 md:w-5 md:h-5" />
                      Начать
                    </button>
                  </div>

                  {/* Progress Circle - Теперь справа и меньше */}
                  <div className="shrink-0 relative w-20 h-20 md:w-32 md:h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-zinc-800" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={strokeDasharray}
                        style={{strokeDashoffset: strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out'}}
                        className="text-green-500"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="font-['Manrope'] text-sm md:text-2xl font-bold text-white">{progressPercent}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>

                  {/* Progress Circle Visual */}
                  <div className="shrink-0 relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray = {strokeDasharray} style={{strokeDashoffset: strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out'}} className="text-green-500" />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="font-['Manrope'] text-2xl font-bold text-white">{progressPercent}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Modules Path View */}
              <div>
                <h2 className="font-['Manrope'] text-xl font-bold text-white mb-6">Программа курса</h2>

                <div className="relative border-l-2 border-zinc-800/80 ml-5 pl-8 space-y-6 pb-6">
                  {lessons.length === 0 ? (
                      <div className="text-zinc-500 text-sm">Уроки пока не добавлены...</div>
                  ) : (
                      lessons.map((lesson: any, index: number) => {
                        const isAdmin = userData?.role === 'admin';

                        const isCompleted = completedLessonIds.includes(lesson.id);
                        const firstUncompletedLesson = lessons.find(l => !completedLessonIds.includes(l.id));
                        const isActive = firstUncompletedLesson?.id === lesson.id;
                        const isLocked = !isCompleted && !isActive;

                        // Если урок скрыт админом (is_published === false), можно его вообще делать заблокированным
                        const effectivelyLocked = isAdmin ? false : (isLocked || !lesson.is_published) && !isActive;

                        return (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={lesson.id}
                                className="relative"
                            >
                              {/* Timeline Node Icon */}
                              <div className={`absolute -left-[43px] w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#0a0a0a] z-10 transition-colors
                          ${isActive ? 'bg-green-500/20 text-green-500' : ''}
                          ${isCompleted ? 'bg-green-500 text-[#0a0a0a]' : ''}
                          ${effectivelyLocked ? 'bg-zinc-800 text-zinc-500' : ''}
                        `}>
                                {isActive && <PlayCircle size={20} className="fill-green-500 text-black" />}
                                {isCompleted && <CheckCircle2 size={20} />}
                                {effectivelyLocked && <Lock size={16} />}
                              </div>

                              {/* Lesson Card */}
                              <div className={`p-5 rounded-2xl border transition-all duration-200 
                          ${isActive ? 'bg-zinc-900 border-green-500/30' : ''}
                          ${isCompleted ? 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700' : ''}
                          ${effectivelyLocked ? 'bg-zinc-900/30 border-zinc-800/30 opacity-75' : ''}
                        `}>
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                  <div>
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="text-sm font-semibold text-zinc-500">Урок {index + 1}</span>
                                      <span className="text-xs text-zinc-600 flex items-center gap-1"><Clock size={12}/> 20 мин</span>
                                    </div>
                                    {/* Берем название из БД FastAPI */}
                                    <h3 className={`font-['Manrope'] text-lg font-bold mb-2 ${isActive || isCompleted ? 'text-white' : 'text-zinc-400'}`}>
                                      {lesson.title}
                                    </h3>
                                    {/* Берем описание из БД FastAPI */}
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                      {lesson.description || "Описание отсутствует"}
                                    </p>
                                  </div>

                                  <div className="shrink-0 mt-2 sm:mt-0">
                                    {isActive && (
                                        <button
                                            onClick={() => navigate(`/lesson/${lesson.id}`)}
                                            className="px-5 py-2 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-black rounded-lg font-semibold transition-all text-sm flex items-center gap-2"
                                        >
                                          Продолжить
                                        </button>
                                    )}
                                    {isCompleted && (
                                        <button
                                            onClick={() => navigate(`/lesson/${lesson.id}`)}
                                            className="px-5 py-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 rounded-lg font-medium transition-all text-sm"
                                        >
                                          Повторить
                                        </button>
                                    )}

                                    {isAdmin && !isActive && !isCompleted && (
                                        <button
                                            onClick={() => navigate(`/lesson/${lesson.id}`)}
                                            className="px-5 py-2 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-black rounded-lg font-medium transition-all text-sm"
                                        >
                                          Тест (Админ)
                                        </button>
                                    )}

                                  </div>
                                </div>
                              </div>
                            </motion.div>
                        );
                      })
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 py-20 bg-zinc-900/20 rounded-3xl border border-zinc-800/50">
              <Lock size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium text-zinc-400">Раздел находится в разработке</p>
            </div>
          )}

          {/* Right Column: Widgets */}
          <div className="xl:w-80 shrink-0 space-y-6 mt-8 xl:mt-0">

            {/* Word of the day Widget */}
            {gestureOfTheDay ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/80">
                    <h3 className="font-['Manrope'] font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-green-500" size={18} />
                      Жест дня
                    </h3>
                  </div>
                  <div className="p-5 flex flex-col items-center justify-center text-center">
                    <div className="w-full h-40 bg-zinc-800 rounded-xl mb-4 overflow-hidden relative group cursor-pointer">

                      {/* Выводим гифку из базы данных (если есть), либо картинку-заглушку */}
                      <ImageWithFallback
                          src={gestureOfTheDay.gif_url || DEFAULT_GESTURE_PLACEHOLDER}
                          alt={gestureOfTheDay.name}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                      />

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                          <PlayCircle className="text-white" size={24} />
                        </div>
                      </div>
                    </div>

                    {/* Выводим реальное название и описание */}
                    <div className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Обучение</div>
                    <div className="font-['Manrope'] text-xl font-bold text-white mb-2">«{gestureOfTheDay.name}»</div>
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {gestureOfTheDay.description || "Описание движения отсутствует."}
                    </p>
                  </div>
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center text-zinc-500">
                  Загрузка жеста дня...
                </div>
            )}

            {/* Recent Words Widget */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-['Manrope'] font-bold text-white flex items-center gap-2">
                  <Clock className="text-green-500" size={18} />
                  Недавние жесты
                </h3>
                <button
                    onClick={() => navigate('/dictionary')}
                    className="text-xs text-zinc-500 hover:text-green-500 transition-colors"
                >
                  Смотреть все
                </button>
              </div>

              <div className="space-y-3">
                {displayGestures.length > 0 ? (
                    displayGestures.map((gesture) => (
                        <div
                            key={gesture.id}
                            className="group flex items-center gap-4 p-3 rounded-xl bg-zinc-800/30 border border-transparent hover:border-zinc-700/50 hover:bg-zinc-800/50 transition-all cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                            <ImageWithFallback
                                src={gesture.gif_url || DEFAULT_GESTURE_PLACEHOLDER}
                                alt={gesture.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-zinc-200 truncate">«{gesture.name}»</div>
                            <div className="text-xs text-zinc-500">
                              {gesture.category || "Общее"}
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                            <PlayCircle size={18} className="text-green-500" />
                          </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-zinc-600 text-sm italic">
                      Вы еще не изучили ни одного жеста
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
