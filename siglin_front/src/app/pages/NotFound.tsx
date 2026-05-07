import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center max-w-lg"
      >
        <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <FileQuestion size={48} className="text-green-500" />
        </div>
        
        <h1 className="font-['Manrope'] text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 mb-4 tracking-tighter">
          404
        </h1>
        <h2 className="font-['Manrope'] text-2xl font-bold mb-4">Страница не найдена</h2>
        <p className="text-zinc-400 mb-10 leading-relaxed">
          Похоже, вы сбились с пути. Страница, которую вы ищете, возможно была удалена, переименована или временно недоступна.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-medium border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 hover:border-zinc-700 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Вернуться назад
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-black transition-all flex items-center justify-center gap-2"
          >
            <Home size={18} />
            На главную
          </button>
        </div>
      </motion.div>
    </div>
  );
}
