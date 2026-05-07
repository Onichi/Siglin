import React, { useState, useEffect } from 'react'; // <--- Добавили useState и useEffect
import { useNavigate } from 'react-router';
import {
  BookOpen,
  BookA,
  UserCircle,
  Award,
  Settings as SettingsIcon,
  Shield
} from 'lucide-react';

interface SidebarNavProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onCloseMobile?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
                                                        activeTab,
                                                        onTabChange,
                                                        onCloseMobile
                                                      }) => {
  const navigate = useNavigate();
  // --- ДОБАВЛЕНО: Состояние для роли ---
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const user = await response.json();
          setIsAdmin(user.role === 'admin'); // Проверяем роль
        }
      } catch (error) {
        console.error("Ошибка проверки роли", error);
      }
    };

    fetchUserRole();
  }, []);
  // ------------------------------------

  const handleMenuClick = (id: string, path: string) => {
    if (onCloseMobile) onCloseMobile();

    if (id === 'profile') navigate('/profile');
    else if (id === 'certificates') navigate('/profile/achievements');
    else if (id === 'settings') navigate('/settings');
    else if (id === 'dictionary') navigate('/dictionary');
    else if (id === 'admin') navigate('/admin');
    else {
      if (window.location.pathname === '/dashboard') {
        if (onTabChange) onTabChange(id);
      } else {
        navigate('/dashboard', { state: { activeTab: id } });
      }
    }
  };

  return (
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-4">Меню обучения</div>
        {[
          { id: 'courses', icon: BookOpen, label: 'Мои курсы', path: '/dashboard' },
          { id: 'dictionary', icon: BookA, label: 'Словарь жестов', path: '/dictionary' },
        ].map((item) => (
            <button
                key={item.id}
                onClick={() => handleMenuClick(item.id, item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === item.id
                        ? 'bg-green-500/10 text-green-500'
                        : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-green-500' : 'text-zinc-500'} />
              <span>{item.label}</span>
            </button>
        ))}

        <div className="mt-8 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-4">Аккаунт</div>
        {[
          { id: 'profile', icon: UserCircle, label: 'Профиль', path: '/profile' },
          { id: 'certificates', icon: Award, label: 'Достижения', path: '/profile/achievements' },
          { id: 'settings', icon: SettingsIcon, label: 'Настройки', path: '/settings' },
        ].map((item) => (
            <button
                key={item.id}
                onClick={() => handleMenuClick(item.id, item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === item.id
                        ? 'bg-green-500/10 text-green-500'
                        : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-green-500' : 'text-zinc-500'} />
              <span>{item.label}</span>
            </button>
        ))}

        {/* --- ДОБАВЛЕНО: Рендерим этот блок ТОЛЬКО если isAdmin === true --- */}
        {isAdmin && (
            <>
              <div className="mt-8 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-4">Система</div>
              {[
                { id: 'admin', icon: Shield, label: 'Админ-панель', path: '/admin' },
              ].map((item) => (
                  <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id, item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                          activeTab === item.id
                              ? 'bg-green-500/10 text-green-500'
                              : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                      }`}
                  >
                    <item.icon size={20} className={activeTab === item.id ? 'text-green-500' : 'text-zinc-500'} />
                    <span>{item.label}</span>
                  </button>
              ))}
            </>
        )}
        {/* ------------------------------------------------------------------ */}
      </nav>
  );
};