import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, HandMetal, BookOpen, Users, Activity,
  Plus, Search, CheckCircle2, Video, ArrowUpRight,
  Menu, X, Upload, Trash2, Eye, EyeOff, Settings2, Save, Pencil
} from 'lucide-react';
import { useNavigate, Link } from 'react-router';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

type TabType = 'overview' | 'gestures' | 'lessons' | 'users' | 'ai';

export function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Состояния для жестов
  const [isGestureModalOpen, setIsGestureModalOpen] = useState(false);
  const [gestureModalMode, setGestureModalMode] = useState<'create' | 'edit'>('create');
  const [activeGestureId, setActiveGestureId] = useState<number | null>(null);

  // Состояния для уроков
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonModalMode, setLessonModalMode] = useState<'create' | 'edit'>('create');
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);

  // Привязка жестов
  const [isGesturesModalOpen, setIsGesturesModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [lessonGesturesIds, setLessonGesturesIds] = useState<number[]>([]);

  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Данные из БД
  const [gestures, setGestures] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Формы
  const [newGestureName, setNewGestureName] = useState('');
  const [newGestureDesc, setNewGestureDesc] = useState('');
  const [newGestureFile, setNewGestureFile] = useState<File | null>(null);

  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [isLessonPublished, setIsLessonPublished] = useState(true);

  // 1. Проверка доступа и первичная загрузка
  useEffect(() => {
    const initAdmin = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        const userRes = await fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!userRes.ok) throw new Error("Не авторизован");

        const user = await userRes.json();
        if (user.role !== 'admin') return navigate('/403');

        setIsCheckingAccess(false);
        fetchAdminData(token);
      } catch (error) {
        navigate('/login');
      }
    };
    initAdmin();
  }, [navigate]);

  const fetchAdminData = async (tokenOverride?: string) => {
    const token = tokenOverride || localStorage.getItem('token');
    try {
      const [gestRes, lessRes, usersRes] = await Promise.all([
        fetch('/api/gestures/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/lessons/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/users/all', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (gestRes.ok) setGestures(await gestRes.json());
      if (lessRes.ok) setLessons(await lessRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (error) {
      console.error("Ошибка загрузки данных", error);
    }
  };

  // --- ФУНКЦИОНАЛ ЖЕСТОВ ---

  const openAddGesture = () => {
    setGestureModalMode('create');
    setActiveGestureId(null);
    setNewGestureName('');
    setNewGestureDesc('');
    setNewGestureFile(null);
    setIsGestureModalOpen(true);
  };

  const openEditGesture = (g: any) => {
    setGestureModalMode('edit');
    setActiveGestureId(g.id);
    setNewGestureName(g.name);
    setNewGestureDesc(g.description || '');
    setNewGestureFile(null);
    setIsGestureModalOpen(true);
  };

  const handleSaveGesture = async () => {
    const token = localStorage.getItem('token');
    if (!newGestureName.trim()) return alert("Введите название жеста!");

    const url = gestureModalMode === 'create' ? '/api/gestures/' : `/api/gestures/${activeGestureId}`;
    const method = gestureModalMode === 'create' ? 'POST' : 'PATCH';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newGestureName, description: newGestureDesc })
      });

      if (res.ok) {
        const savedGesture = await res.json();

        // Загрузка файла (если выбран новый)
        if (newGestureFile) {
          const formData = new FormData();
          formData.append('file', newGestureFile);
          await fetch(`/api/gestures/${savedGesture.id}/media`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
        }

        setIsGestureModalOpen(false);
        fetchAdminData();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Ошибка сохранения");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGesture = async (id: number) => {
    if (!window.confirm("Удалить этот жест безвозвратно?")) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/gestures/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchAdminData();
  };

  // --- ФУНКЦИОНАЛ УРОКОВ ---

  const openAddLesson = () => {
    setLessonModalMode('create');
    setActiveLessonId(null);
    setNewLessonTitle('');
    setNewLessonDesc('');
    setIsLessonPublished(false);
    setIsLessonModalOpen(true);
  };

  const openEditLesson = (l: any) => {
    setLessonModalMode('edit');
    setActiveLessonId(l.id);
    setNewLessonTitle(l.title);
    setNewLessonDesc(l.description || '');
    setIsLessonPublished(l.is_published);
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async () => {
    const token = localStorage.getItem('token');
    if (!newLessonTitle.trim()) return alert("Введите название урока!");

    const url = lessonModalMode === 'create' ? '/api/lessons/' : `/api/lessons/${activeLessonId}`;
    const method = lessonModalMode === 'create' ? 'POST' : 'PATCH';

    const payload: any = {
      title: newLessonTitle,
      description: newLessonDesc,
      is_published: isLessonPublished,
    };

    if (lessonModalMode === 'create') {
      payload.order_index = lessons.length + 1;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsLessonModalOpen(false);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!window.confirm("Удалить этот урок?")) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/lessons/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchAdminData();
  };

  const toggleLessonVisibility = async (lesson: any) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_published: !lesson.is_published })
      });
      fetchAdminData();
    } catch (e) { console.error(e); }
  };

  // --- ПРИВЯЗКА ЖЕСТОВ К УРОКУ ---

  const openGesturesModal = async (lesson: any) => {
    setSelectedLesson(lesson);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/lessons/${lesson.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const fullLesson = await res.json();
        const currentIds = fullLesson.gestures?.map((g: any) => g.gesture.id) || [];
        setLessonGesturesIds(currentIds);
        setIsGesturesModalOpen(true);
      }
    } catch (e) { console.error("Ошибка загрузки деталей урока", e); }
  };

  const handleSyncGestures = async () => {
    const token = localStorage.getItem('token');
    try {
      const gesturesIn = lessonGesturesIds.map((id, index) => ({
        gesture_id: id,
        order_index: index + 1
      }));

      const res = await fetch(`/api/lessons/${selectedLesson.id}/gestures`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(gesturesIn)
      });

      if (res.ok) {
        setIsGesturesModalOpen(false);
        fetchAdminData();
      }
    } catch (e) { console.error(e); }
  };

  const toggleGestureInLesson = (id: number) => {
    setLessonGesturesIds(prev => prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]);
  };

  // --- ЭКРАН ЗАГРУЗКИ ---
  if (isCheckingAccess) {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-zinc-500">
          <div className="w-12 h-12 border-4 border-zinc-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <p className="font-['Manrope'] font-medium">Проверка прав доступа...</p>
        </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  { label: 'Всего жестов', value: gestures.length, icon: HandMetal },
                  { label: 'Уроков', value: lessons.length, icon: BookOpen },
                  { label: 'Пользователей', value: users.length, icon: Users },
                  { label: 'Ошибки ИИ', value: '0', icon: Activity },
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                          <stat.icon size={24} />
                        </div>
                      </div>
                      <div className="font-['Manrope'] text-3xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-sm text-zinc-500 font-medium">{stat.label}</div>
                    </div>
                ))}
              </div>
            </div>
        );

      case 'gestures':
        return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="font-['Manrope'] text-2xl font-bold text-white">Библиотека жестов</h2>
                <button
                    onClick={openAddGesture}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2.5 rounded-xl transition-all"
                >
                  <Plus size={18} /> Добавить жест
                </button>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 bg-zinc-900/50">
                      <th className="px-6 py-4 font-semibold">Слово / Жест</th>
                      <th className="px-6 py-4 font-semibold">Описание</th>
                      <th className="px-6 py-4 font-semibold text-right">Действия</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                    {gestures.map(g => (
                        <tr key={g.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                                {g.gif_url ? (
                                    <ImageWithFallback src={g.gif_url} alt={g.name} className="w-full h-full object-cover"/>
                                ) : <Video size={18} className="text-zinc-500" />}
                              </div>
                              <span className="font-medium text-white">{g.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-400 max-w-xs truncate">{g.description || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEditGesture(g)} className="text-zinc-400 hover:text-blue-500 transition-colors p-2" title="Редактировать">
                                <Pencil size={18}/>
                              </button>
                              <button onClick={() => handleDeleteGesture(g.id)} className="text-red-500/50 hover:text-red-500 transition-colors p-2" title="Удалить">
                                <Trash2 size={18}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        );

      case 'lessons':
        return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="font-['Manrope'] text-2xl font-bold text-white">Управление уроками</h2>
                <button
                    onClick={openAddLesson}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2.5 rounded-xl transition-all"
                >
                  <Plus size={18} /> Создать урок
                </button>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 bg-zinc-900/50">
                      <th className="px-6 py-4 font-semibold">Название урока</th>
                      <th className="px-6 py-4 font-semibold">Жесты</th>
                      <th className="px-6 py-4 font-semibold">Статус</th>
                      <th className="px-6 py-4 font-semibold text-right">Действия</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                    {lessons.map(l => (
                        <tr key={l.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{l.title}</td>
                          <td className="px-6 py-4 text-sm text-zinc-400">
                            {l.gestures_count || 0} шт.
                          </td>
                          <td className="px-6 py-4">
                            <button onClick={() => toggleLessonVisibility(l)} className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border transition-all ${l.is_published ? 'border-green-500/30 text-green-500' : 'border-zinc-700 text-zinc-500'}`}>
                              {l.is_published ? <><Eye size={14}/> Опубликован</> : <><EyeOff size={14}/> Черновик</>}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 whitespace-nowrap">
                              <button onClick={() => openGesturesModal(l)} className="text-zinc-400 hover:text-green-500 p-2" title="Настроить жесты"><Settings2 size={18}/></button>
                              <button onClick={() => openEditLesson(l)} className="text-zinc-400 hover:text-blue-500 p-2" title="Редактировать"><Pencil size={18}/></button>
                              <button onClick={() => handleDeleteLesson(l.id)} className="text-red-500/50 hover:text-red-500 p-2" title="Удалить"><Trash2 size={18}/></button>
                            </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        );

      case 'users':
        return (
            <div className="space-y-6">
              <h2 className="font-['Manrope'] text-2xl font-bold text-white">Пользователи</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 bg-zinc-900/50">
                      <th className="px-6 py-4 font-semibold">Имя и Email</th>
                      <th className="px-6 py-4 font-semibold">Роль</th>
                      <th className="px-6 py-4 font-semibold">Уровень / XP</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                                {user.avatar_url ? <ImageWithFallback src={user.avatar_url} className="w-full h-full object-cover"/> : user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-white">{user.username}</div>
                                <div className="text-xs text-zinc-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {user.role}
                          </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-400">Ур. {user.level} ({user.xp} XP)</td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        );

      default:
        return null;
    }
  };

  const TABS: { id: TabType, label: string, icon: any }[] = [
    { id: 'overview', label: 'Обзор', icon: LayoutDashboard },
    { id: 'gestures', label: 'Жесты', icon: HandMetal },
    { id: 'lessons', label: 'Уроки', icon: BookOpen },
    { id: 'users', label: 'Пользователи', icon: Users },
  ];

  return (
      <div className="flex h-screen bg-[#0a0a0a] text-zinc-300 font-['Inter'] overflow-hidden">

        {/* Кнопка меню на мобилках */}
        <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden absolute top-4 right-4 z-50 p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white"
        >
          <Menu size={24} />
        </button>

        {/* Сайдбар */}
        <div className={`fixed inset-y-0 left-0 w-72 bg-[#0a0a0a] border-r border-zinc-800/80 transform transition-transform duration-300 z-40 lg:relative lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
                  <HandMetal size={24} className="text-green-500" />
                </div>
                <div>
                  <span className="font-['Manrope'] text-xl font-bold tracking-tight text-white block">Signura</span>
                  <span className="text-xs text-green-500 font-medium uppercase tracking-wider">Admin Panel</span>
                </div>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-zinc-500 p-1">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
              {TABS.map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                          activeTab === tab.id ? 'bg-green-500/10 text-green-500' : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                      }`}
                  >
                    <tab.icon size={20} className={activeTab === tab.id ? 'text-green-500' : 'text-zinc-500'} />
                    <span>{tab.label}</span>
                  </button>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-800/80">
              <Link to="/dashboard" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-sm font-medium">
                Вернуться на платформу
              </Link>
            </div>
          </div>
        </div>

        {/* Основной контент */}
        <main className="flex-1 flex flex-col h-screen overflow-y-auto">
          <div className="max-w-6xl w-full mx-auto p-6 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* МОДАЛКА ПРИВЯЗКИ ЖЕСТОВ К УРОКУ */}
        <AnimatePresence>
          {isGesturesModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsGesturesModalOpen(false)} />
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
                  <div className="flex items-center justify-between p-6 border-b border-zinc-800/80 shrink-0">
                    <div>
                      <h3 className="text-xl font-bold text-white">Жесты в уроке</h3>
                      <p className="text-sm text-zinc-500">{selectedLesson?.title}</p>
                    </div>
                    <button onClick={() => setIsGesturesModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[300px]">
                    {gestures.map(g => (
                        <div
                            key={g.id}
                            onClick={() => toggleGestureInLesson(g.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                                lessonGesturesIds.includes(g.id) ? 'bg-green-500/10 border-green-500 text-white' : 'bg-zinc-800/50 border-transparent text-zinc-400 hover:border-zinc-700'
                            }`}
                        >
                          <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                            {lessonGesturesIds.includes(g.id) ? <CheckCircle2 size={16} className="text-green-500"/> : <Plus size={16}/>}
                          </div>
                          <span className="text-sm font-medium truncate">{g.name}</span>
                        </div>
                    ))}
                  </div>

                  <div className="p-6 border-t border-zinc-800/80 flex justify-end gap-3 shrink-0">
                    <button onClick={() => setIsGesturesModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">Отмена</button>
                    <button onClick={handleSyncGestures} className="px-6 py-2.5 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-black flex items-center gap-2 transition-colors">
                      <Save size={18}/> Сохранить состав
                    </button>
                  </div>
                </motion.div>
              </div>
          )}
        </AnimatePresence>

        {/* УНИВЕРСАЛЬНАЯ МОДАЛКА ЖЕСТА (Добавление / Редактирование) */}
        <AnimatePresence>
          {isGestureModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsGestureModalOpen(false)} />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="flex items-center justify-between p-6 border-b border-zinc-800/80">
                    <h3 className="font-['Manrope'] text-xl font-bold text-white">
                      {gestureModalMode === 'create' ? 'Добавить новый жест' : 'Редактировать жест'}
                    </h3>
                    <button onClick={() => setIsGestureModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Название жеста *</label>
                      <input value={newGestureName} onChange={e => setNewGestureName(e.target.value)} type="text" className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all" placeholder="Например: Здравствуйте" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Описание движения</label>
                      <textarea value={newGestureDesc} onChange={e => setNewGestureDesc(e.target.value)} rows={3} className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all resize-none" placeholder="Краткое описание..." />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Обучающий GIF / Видео</label>
                      <input type="file" accept="image/*,video/*" onChange={e => setNewGestureFile(e.target.files?.[0] || null)} className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-500/10 file:text-green-500 hover:file:bg-green-500/20 file:transition-colors file:cursor-pointer" />
                      {gestureModalMode === 'edit' && <p className="text-xs text-zinc-500 mt-2">Оставьте пустым, если не хотите менять текущее видео.</p>}
                    </div>
                  </div>

                  <div className="p-6 border-t border-zinc-800/80 flex justify-end gap-3 bg-zinc-900/50 rounded-b-3xl">
                    <button onClick={() => setIsGestureModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">Отмена</button>
                    <button onClick={handleSaveGesture} className="px-6 py-2.5 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-black transition-colors">Сохранить</button>
                  </div>
                </motion.div>
              </div>
          )}
        </AnimatePresence>

        {/* УНИВЕРСАЛЬНАЯ МОДАЛКА УРОКА (Добавление / Редактирование) */}
        <AnimatePresence>
          {isLessonModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsLessonModalOpen(false)} />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="flex items-center justify-between p-6 border-b border-zinc-800/80">
                    <h3 className="font-['Manrope'] text-xl font-bold text-white">
                      {lessonModalMode === 'create' ? 'Создать новый урок' : 'Редактировать урок'}
                    </h3>
                    <button onClick={() => setIsLessonModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Название урока *</label>
                      <input value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} type="text" className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all" placeholder="Например: Основы алфавита" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Описание урока</label>
                      <textarea value={newLessonDesc} onChange={e => setNewLessonDesc(e.target.value)} rows={3} className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all resize-none" placeholder="Чему научится студент..." />
                    </div>

                    <label className="flex items-center gap-3 p-2 cursor-pointer w-fit">
                      <input type="checkbox" checked={isLessonPublished} onChange={e => setIsLessonPublished(e.target.checked)} className="w-5 h-5 rounded bg-zinc-900 border-zinc-600 text-green-500 focus:ring-green-500 focus:ring-offset-zinc-800" />
                      <span className="text-sm font-medium text-white">Опубликован</span>
                    </label>
                  </div>

                  <div className="p-6 border-t border-zinc-800/80 flex justify-end gap-3 bg-zinc-900/50 rounded-b-3xl">
                    <button onClick={() => setIsLessonModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">Отмена</button>
                    <button onClick={handleSaveLesson} className="px-6 py-2.5 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-black transition-colors">Сохранить</button>
                  </div>
                </motion.div>
              </div>
          )}
        </AnimatePresence>

      </div>
  );
}