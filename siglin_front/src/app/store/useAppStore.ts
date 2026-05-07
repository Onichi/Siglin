import { create } from 'zustand';

export const DEFAULT_GESTURE_PLACEHOLDER = "/images/placeholder.png";


// Описываем, какие данные будут храниться
interface AppState {
    userData: any | null;
    completedLessonIds: number[];
    lessons: any[];
    gestures: any[];
    recentGestureIds: number[];
    isLoading: boolean;
    isAuthenticated: boolean; // <--- 1. ДОБАВИЛИ ФЛАГ АВТОРИЗАЦИИ

    // Функции для работы с данными
    fetchGlobalData: () => Promise<void>;
    login: (token: string) => Promise<void>; // <--- 2. ДОБАВИЛИ ФУНКЦИЮ ЛОГИНА
    logout: () => void;
}

// Создаем само хранилище (добавили get, чтобы вызывать функции внутри других функций)
export const useAppStore = create<AppState>((set, get) => ({
    // Начальные значения
    userData: null,
    completedLessonIds: [],
    lessons: [],
    gestures: [],
    recentGestureIds: [],
    isLoading: true,

    // Изначально проверяем, есть ли токен в памяти браузера.
    // Если есть - считаем, что пользователь (пока) авторизован.
    isAuthenticated: !!localStorage.getItem('token'),

    // --- НОВАЯ ФУНКЦИЯ ЛОГИНА ---
    login: async (token: string) => {
        // 1. Сохраняем токен
        localStorage.setItem('token', token);

        // 2. МГНОВЕННО говорим приложению "Мы вошли!".
        // Благодаря этому ProtectedRoute нас не выкинет на /login
        set({ isAuthenticated: true });

        // 3. Скачиваем данные пользователя и ждем окончания
        await get().fetchGlobalData();
    },

    // Функция для загрузки данных с бэкенда
    fetchGlobalData: async () => {
        const token = localStorage.getItem('token');

        // Если токена нет, нечего загружать — выключаем всё
        if (!token) {
            set({ isLoading: false, userData: null, isAuthenticated: false });
            return;
        }

        // Включаем загрузку ТОЛЬКО если у нас еще нет данных пользователя
        // (чтобы избежать бесконечного спиннера при обновлениях внутри системы)
        if (!get().userData) {
            set({ isLoading: true });
        }

        try {
            const [userRes, progressRes, lessonsRes, gesturesRes] = await Promise.all([
                fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/users/me/lessons', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/lessons/', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/gestures/')
            ]);

            // Если основной запрос пользователя прошел
            if (userRes.ok) {
                const userData = await userRes.json();

                // Обрабатываем остальные данные (даже если они пустые)
                const completedLessonIds = progressRes.ok ? await progressRes.json() : [];
                const lessons = lessonsRes.ok ? await lessonsRes.json() : [];
                const gestures = gesturesRes.ok ? await gesturesRes.json() : [];

                set({
                    userData,
                    completedLessonIds,
                    lessons,
                    gestures,
                    isAuthenticated: true,
                    isLoading: false // Выключаем загрузку сразу после успеха
                });
            } else {
                // Если 401 или другая ошибка авторизации — выходим
                get().logout();
            }
        } catch (error) {
            console.error("Ошибка загрузки глобальных данных:", error);
            // Пытаемся выключить загрузку, чтобы не висел спиннер при ошибке сети
            set({ isLoading: false });
        } finally {
            // Гарантированный предохранитель: выключаем загрузку в любом случае через 500мс
            // если она почему-то все еще висит
            setTimeout(() => set({ isLoading: false }), 500);
        }
    },

    // Функция для выхода из аккаунта
    logout: () => {
        localStorage.removeItem('token');
        set({
            userData: null,
            completedLessonIds: [],
            lessons: [],
            isAuthenticated: false // <--- Сбрасываем статус
        });
        window.location.href = '/login';
    }
}));