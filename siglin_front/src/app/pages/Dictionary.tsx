import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, PlayCircle, BookA, X, Info } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAppStore, DEFAULT_GESTURE_PLACEHOLDER } from '../store/useAppStore';

export function Dictionary() {
  const { gestures } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Все');
  // --- ВОЗВРАЩАЕМ СОСТОЯНИЕ ДЛЯ ПОП-АПА ---
  const [selectedGesture, setSelectedGesture] = useState<any | null>(null);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(gestures.map(g => g.category).filter(Boolean)));
    return ['Все', ...uniqueCategories];
  }, [gestures]);

  const filteredGestures = gestures.filter(gesture => {
    const matchesSearch = gesture.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Все' || gesture.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Закрытие поп-апа по клику на фон
  const handleCloseModal = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'modal-backdrop') {
      setSelectedGesture(null);
    }
  };

  return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full flex flex-col h-full relative">

        {/* Заголовок страницы */}
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <BookA className="text-green-500" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 font-['Manrope']">Словарь жестов</h1>
            <p className="text-zinc-400 text-sm">Интерактивный справочник РЖЯ</p>
          </div>
        </div>

        {/* Панель поиска и фильтров */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
                type="text"
                placeholder="Поиск по названию жеста..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
            {categories.map(category => (
                <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-5 py-3 rounded-xl whitespace-nowrap font-medium transition-all text-sm ${
                        activeCategory === category
                            ? 'bg-green-500 text-black'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                >
                  {category}
                </button>
            ))}
          </div>
        </div>

        {/* Сетка жестов */}
        {filteredGestures.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {filteredGestures.map((gesture, index) => (
                  <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={gesture.id}
                      onClick={() => setSelectedGesture(gesture)} // <--- ОТКРЫВАЕМ ПОП-АП
                      className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-green-500/30 transition-colors cursor-pointer"
                  >
                    <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                      <ImageWithFallback
                          src={gesture.gif_url || DEFAULT_GESTURE_PLACEHOLDER}
                          alt={gesture.name}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-green-500 text-black rounded-full flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          <PlayCircle size={24} className="ml-1" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-xs text-zinc-500 mb-1">{gesture.category || 'Общее'}</div>
                      <h3 className="font-['Manrope'] font-bold text-white text-lg group-hover:text-green-400 transition-colors">
                        {gesture.name}
                      </h3>
                    </div>
                  </motion.div>
              ))}
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-500">
              <Search size={48} className="mb-4 text-zinc-700" />
              <h3 className="text-xl font-['Manrope'] font-semibold text-zinc-400 mb-2">Ничего не найдено</h3>
              <p className="text-center max-w-md text-sm">
                Мы не смогли найти жесты по вашему запросу. Попробуйте изменить параметры поиска или выбрать другую категорию.
              </p>
            </div>
        )}

        {/* --- ВОЗВРАЩАЕМ ПОП-АП (МОДАЛЬНОЕ ОКНО) --- */}
        <AnimatePresence>
          {selectedGesture && (
              <motion.div
                  id="modal-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleCloseModal}
                  className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden relative shadow-2xl"
                >
                  {/* Кнопка закрытия */}
                  <button
                      onClick={() => setSelectedGesture(null)}
                      className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>

                  <div className="flex flex-col md:flex-row h-full">
                    {/* Левая часть: Визуал (Гифка/Картинка) */}
                    <div className="w-full md:w-1/2 bg-zinc-900 relative aspect-video md:aspect-auto flex items-center justify-center">
                      <ImageWithFallback
                          src={selectedGesture.gif_url || DEFAULT_GESTURE_PLACEHOLDER}
                          alt={selectedGesture.name}
                          className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Правая часть: Информация */}
                    <div className="w-full md:w-1/2 p-6 flex flex-col justify-center">
                      <div className="inline-block px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 w-fit">
                        {selectedGesture.category || 'Общее'}
                      </div>

                      <h2 className="font-['Manrope'] text-3xl font-bold text-white mb-4">
                        {selectedGesture.name}
                      </h2>

                      <div className="flex items-start gap-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 mb-6">
                        <Info className="text-zinc-400 shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {selectedGesture.description || "Подробное описание того, как правильно выполнять этот жест, пока не добавлено."}
                        </p>
                      </div>

                      {/* Кнопки действий */}
                      <div className="flex gap-3 mt-auto">
                        <button
                            onClick={() => setSelectedGesture(null)}
                            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          Закрыть
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}