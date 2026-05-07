import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, TrendingUp, Clock, HandMetal } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SidebarNav } from './SidebarNav';

// Импортируем наше хранилище Zustand
import { useAppStore } from '../store/useAppStore';

export function AppLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Достаем из Zustand только те данные, которые нужны для каркаса
    const { userData, lessons, completedLessonIds, isLoading, fetchGlobalData } = useAppStore();

    // При первом рендере каркаса запускаем загрузку всех данных
    useEffect(() => {
        fetchGlobalData();
    }, [fetchGlobalData]);

    // Проверка авторизации: если данные загрузились, но пользователя нет — на выход
    useEffect(() => {
        if (!isLoading && !userData) {
            navigate('/login');
        }
    }, [isLoading, userData, navigate]);

    // Пока данные грузятся, показываем спиннер на весь экран
    if (isLoading || !userData) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-zinc-500">
                <div className="w-12 h-12 border-4 border-zinc-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
                <p className="font-['Manrope'] font-medium">Синхронизация профиля...</p>
            </div>
        );
    }

    // Считаем общий прогресс курса для хедера
    const progressPercent = lessons.length > 0
        ? Math.round((completedLessonIds.length / lessons.length) * 100)
        : 0;

    // Берем аватарку пользователя (или заглушку, если её нет)
    const avatarImage = userData.avatar_url || "https://images.unsplash.com/photo-1772839921960-6a81eb5a135c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kcyUyMGNvbW11bmljYXRpb24lMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3Nzc0Njc2MzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

    // Определяем активную вкладку для подсветки в боковом меню
    let activeTab = location.pathname.split('/')[1] || 'dashboard';

    if (activeTab === 'dashboard') {
        activeTab = 'courses';
    }

    if (location.pathname === '/profile/achievements') {
        activeTab = 'certificates';
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-['Inter'] selection:bg-green-500/30 selection:text-green-200 overflow-x-hidden flex">

            {/* Мобильный оверлей */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Сайдбар */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-zinc-800/80 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
                <div className="p-6 flex items-center justify-between">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 text-green-500 hover:opacity-80 transition-opacity">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <HandMetal size={28} className="text-green-500" />
                        </div>
                        <span className="font-['Manrope'] text-2xl font-bold tracking-tight text-white">SigLin</span>
                    </button>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-green-400">
                        <X size={24} />
                    </button>
                </div>

                <SidebarNav activeTab={activeTab} onCloseMobile={() => setIsSidebarOpen(false)} />

                <div className="p-6 border-t border-zinc-800/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                            <ImageWithFallback src={avatarImage} alt="User" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="font-medium text-sm text-zinc-100">{userData.username}</div>
                            <div className="text-xs text-zinc-500">{userData.role === 'admin' ? 'Администратор' : 'Студент'} • Базовый курс</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Основная контентная область */}
            <main className="lg:pl-72 flex-1 min-h-screen flex flex-col relative w-full">

                {/* Глобальный хедер */}
                <header className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between lg:justify-end">
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-green-400">
                        <Menu size={28} />
                    </button>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                            <TrendingUp size={16} className="text-green-500" />
                            Прогресс курса: <span className="text-white font-semibold">{progressPercent}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                            <Clock size={16} className="text-green-500" />
                            Ур. {userData.level} ({userData.xp} XP)
                        </div>
                    </div>
                </header>

                {/* СЮДА БУДУТ ПОДСТАВЛЯТЬСЯ ВСЕ СТРАНИЦЫ (Dashboard, Dictionary и т.д.) */}
                <div className="flex-1 w-full relative">
                    <Outlet />
                </div>

            </main>
        </div>
    );
}