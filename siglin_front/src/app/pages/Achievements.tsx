import React from 'react';
import { motion } from 'motion/react';
import { Award, Flame, Star, Zap, Lock, Trophy, Shield, CheckCircle2 } from 'lucide-react';
import { useAppStore, DEFAULT_GESTURE_PLACEHOLDER } from '../store/useAppStore';



export function Achievements() {
  const { userData, completedLessonIds, lessons } = useAppStore();

  const xp = userData?.xp || 0;
  const streak = userData?.streak_days || 0;
  const level = userData?.level || 1;
  const completedLessons = completedLessonIds.length;
  const totalLessons = lessons.length > 0 ? lessons.length : 1;

  // Добавили свойство progressColor, чтобы Tailwind "видел" полные названия классов
  const ACHIEVEMENTS = [
    {
      id: 'first_lesson',
      title: 'Первый шаг',
      description: 'Пройти свой первый урок',
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      progressColor: 'bg-yellow-500', // <--- Полное имя класса
      isUnlocked: completedLessons >= 1,
      progress: Math.min(completedLessons, 1),
      maxProgress: 1,
    },
    {
      id: 'streak_3',
      title: 'В ударе',
      description: 'Удерживать ударный режим 3 дня',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      progressColor: 'bg-orange-500',
      isUnlocked: streak >= 3,
      progress: Math.min(streak, 3),
      maxProgress: 3,
    },
    {
      id: 'level_5',
      title: 'Упорный ученик',
      description: 'Достичь 5 уровня',
      icon: Trophy,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      progressColor: 'bg-purple-500',
      isUnlocked: level >= 5,
      progress: Math.min(level, 5),
      maxProgress: 5,
    },
    {
      id: 'xp_1000',
      title: 'Копилка знаний',
      description: 'Набрать 1000 XP',
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      progressColor: 'bg-blue-500',
      isUnlocked: xp >= 1000,
      progress: Math.min(xp, 1000),
      maxProgress: 1000,
    },
    {
      id: 'half_course',
      title: 'Экватор',
      description: 'Пройти половину базового курса',
      icon: Shield,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      progressColor: 'bg-teal-500',
      isUnlocked: completedLessons >= Math.ceil(totalLessons / 2),
      progress: Math.min(completedLessons, Math.ceil(totalLessons / 2)),
      maxProgress: Math.ceil(totalLessons / 2),
    },
    {
      id: 'all_lessons',
      title: 'Магистр жестов',
      description: 'Пройти все доступные уроки курса',
      icon: Award,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      progressColor: 'bg-green-500',
      isUnlocked: completedLessons >= totalLessons && totalLessons > 1,
      progress: Math.min(completedLessons, totalLessons),
      maxProgress: totalLessons,
    }
  ];

  const unlockedCount = ACHIEVEMENTS.filter(a => a.isUnlocked).length;

  return (
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col h-full relative">

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Award className="text-green-500" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1 font-['Manrope']">Достижения</h1>
              <p className="text-zinc-400 text-sm">Твоя стена славы и наград</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 flex items-center gap-4 w-fit">
            <div className="text-zinc-400 text-sm">Открыто наград:</div>
            <div className="text-xl font-bold text-white font-['Manrope']">
              <span className="text-green-500">{unlockedCount}</span> / {ACHIEVEMENTS.length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ACHIEVEMENTS.map((achievement, index) => {
            const progressPercent = Math.round((achievement.progress / achievement.maxProgress) * 100);

            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={achievement.id}
                    className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col transition-all duration-300 ${
                        achievement.isUnlocked
                            ? `bg-zinc-900 ${achievement.borderColor} shadow-lg shadow-${achievement.color.split('-')[1]}-500/5`
                            : 'bg-zinc-900/50 border-zinc-800/50 opacity-75 grayscale-[50%]'
                    }`}
                >
                  {achievement.isUnlocked && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 size={20} className="text-green-500" />
                      </div>
                  )}

                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        achievement.isUnlocked ? achievement.bgColor : 'bg-zinc-800'
                    }`}>
                      {achievement.isUnlocked ? (
                          <achievement.icon size={28} className={achievement.color} />
                      ) : (
                          <Lock size={28} className="text-zinc-500" />
                      )}
                    </div>

                    <div className="pr-6">
                      <h3 className={`font-['Manrope'] font-bold text-lg mb-1 ${achievement.isUnlocked ? 'text-white' : 'text-zinc-400'}`}>
                        {achievement.title}
                      </h3>
                      <p className="text-zinc-500 text-sm leading-relaxed">
                        {achievement.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs font-medium mb-2">
                      <span className={achievement.isUnlocked ? 'text-zinc-300' : 'text-zinc-500'}>
                        Прогресс
                      </span>
                      <span className={achievement.isUnlocked ? achievement.color : 'text-zinc-500'}>
                        {achievement.progress} / {achievement.maxProgress}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 + 0.3 }}
                          // Изменили способ вывода цвета здесь:
                          className={`h-full rounded-full ${achievement.isUnlocked ? achievement.progressColor : 'bg-zinc-600'}`}
                      />
                    </div>
                  </div>

                  {achievement.isUnlocked && (
                      <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-20 pointer-events-none ${achievement.bgColor.replace('/10', '')}`} />
                  )}
                </motion.div>
            );
          })}
        </div>
      </div>
  );
}