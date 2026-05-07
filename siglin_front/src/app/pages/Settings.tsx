import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  UserCircle,
  Settings as SettingsIcon,
  HandMetal,
  X,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Save,
  LogOut,
  Upload,
  Camera
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAppStore } from '../store/useAppStore';

export const Settings = () => {
  const navigate = useNavigate();
  const { userData, fetchGlobalData, logout } = useAppStore();

  // Состояния навигации
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Состояния данных (из Zustand)
  const [username, setUsername] = useState(userData?.username || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(userData?.avatar_url || '');

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const tabs = [
    { id: 'general', label: 'Основные', icon: UserCircle },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Файл слишком большой (макс. 2МБ)");
        return;
      }
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const response = await fetch('/api/users/me/update', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        await fetchGlobalData();
        setMessage({ type: 'success', text: 'Настройки обновлены!' });
      } else {
        setMessage({ type: 'error', text: 'Ошибка при сохранении' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка сети' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <div className="flex-1 p-6 lg:p-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">

          {/* Settings Sidebar (Внутренние табы) */}
          <div className="w-full md:w-64 shrink-0 space-y-2">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMessage(null);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        activeTab === tab.id
                            ? 'bg-zinc-800/80 text-white border border-zinc-700/50'
                            : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'
                    }`}
                >
                  <tab.icon size={20} className={activeTab === tab.id ? 'text-green-500' : 'text-zinc-500'} />
                  <span>{tab.label}</span>
                </button>
            ))}

            <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-500/10 transition-all mt-4 border border-transparent hover:border-red-500/20"
            >
              <LogOut size={20} />
              <span>Выйти из аккаунта</span>
            </button>
          </div>

          {/* Settings Content Area */}
          <div className="flex-1 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 md:p-8">
            <AnimatePresence mode="wait">

              {/* TAB: GENERAL */}
              {activeTab === 'general' && (
                  <motion.div
                      key="general"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                  >
                    <div>
                      <h2 className="text-xl font-bold font-['Manrope'] text-white mb-1">Основные настройки</h2>
                      <p className="text-sm text-zinc-400">Управляйте информацией вашего профиля Siglin.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-8 items-start">
                      <div className="flex flex-col items-center gap-4 shrink-0">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-full overflow-hidden bg-[#0a0a0a] border border-zinc-800">
                            <img src={previewUrl || "/default-avatar.png"} alt="User" className="w-full h-full object-cover" />
                          </div>
                          <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                            <Camera size={24} className="text-white" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </label>
                        </div>
                        <label className="text-sm font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 py-2 px-4 rounded-xl transition-colors border border-zinc-700/50 cursor-pointer">
                          Изменить фото
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                      </div>

                      <form className="flex-1 space-y-5 w-full" onSubmit={handleSaveGeneral}>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-300">Имя пользователя</label>
                          <input
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-300">Email адрес</label>
                          <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                          />
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {message.text}
                            </div>
                        )}

                        <div className="pt-4">
                          <button
                              type="submit"
                              disabled={isSaving}
                              className="bg-green-500 hover:bg-green-400 disabled:bg-zinc-700 text-black font-semibold py-3 px-8 rounded-xl transition-colors flex items-center gap-2"
                          >
                            {isSaving ? "Сохранение..." : "Сохранить изменения"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
              )}

              {/* TAB: SECURITY */}
              {activeTab === 'security' && (
                  <motion.div
                      key="security"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                  >
                    <div>
                      <h2 className="text-xl font-bold font-['Manrope'] text-white mb-1">Смена пароля</h2>
                      <p className="text-sm text-zinc-400">Обновите ваш пароль для защиты аккаунта.</p>
                    </div>

                    <form className="space-y-5 max-w-md" onSubmit={(e) => e.preventDefault()}>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Текущий пароль</label>
                        <div className="relative">
                          <input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-green-500 transition-all"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Новый пароль</label>
                        <div className="relative">
                          <input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Минимум 8 символов"
                              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-green-500 transition-all"
                          />
                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors border border-zinc-700">
                          Обновить пароль
                        </button>
                      </div>
                    </form>

                    <div className="pt-8 mt-8 border-t border-zinc-800/80">
                      <h3 className="text-lg font-bold font-['Manrope'] text-red-500 mb-4">Опасная зона</h3>
                      <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                          <div className="font-medium text-white mb-1">Удалить аккаунт</div>
                          <div className="text-sm text-zinc-500">Это действие невозможно отменить.</div>
                        </div>
                        <button className="bg-transparent text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition-all">
                          Удалить
                        </button>
                      </div>
                    </div>
                  </motion.div>
              )}

              {/* TAB: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                  <motion.div
                      key="notifications"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <Bell size={48} className="text-zinc-700 mb-4" />
                    <h3 className="text-lg font-medium text-zinc-300">Настройки уведомлений</h3>
                    <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto">Управление пуш-уведомлениями и напоминаниями появится в следующем обновлении.</p>
                  </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
  );
};