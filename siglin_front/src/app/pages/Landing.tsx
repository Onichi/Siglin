import React, {useEffect} from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  HandMetal,
  BookOpen,
  Video,
  Users,
  ArrowRight,
  PlayCircle
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { DEFAULT_GESTURE_PLACEHOLDER, useAppStore } from '../store/useAppStore';


export function Landing() {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const bgHeroImage = DEFAULT_GESTURE_PLACEHOLDER;

  const features = [
    {
      icon: Video,
      title: 'Интерактивные видео-уроки',
      desc: 'Четкие инструкции и разбор каждого жеста .'
    },
    {
      icon: BookOpen,
      title: 'Структурированная программа',
      desc: 'От алфавита до сложных фраз. Двигайтесь в комфортном темпе, отслеживая прогресс.'
    },
    {
      icon: Users,
      title: 'Возможность выучить что-то новое',
      desc: 'Изучение языка жестов это увлекательный процесс'
    }
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-zinc-300 font-['Inter'] selection:bg-green-500/30 selection:text-green-200 overflow-x-hidden flex flex-col relative">

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <ImageWithFallback
          src={bgHeroImage}
          alt="Hands Communication"
          className="w-full h-full object-cover opacity-30 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0a0a_100%)]" />
      </div>

      {/* Header */}
      <header className="relative z-20 px-6 py-6 md:py-8 lg:px-12 flex justify-between items-center max-w-[1600px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 text-green-500"
        >
          <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20 backdrop-blur-md">
            <HandMetal size={32} className="text-green-500" />
          </div>
          <span className="font-['Manrope'] text-2xl lg:text-3xl font-bold tracking-tight text-white">
            SigLin
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >

          <div className="h-6 w-px bg-zinc-800 hidden md:block"></div>
          <button
            onClick={() => navigate('/login')}
            className="text-zinc-300 hover:text-white font-medium text-sm transition-colors"
          >
            Войти
          </button>
          <button
            onClick={() => navigate('/register')}
            className="hidden sm:flex items-center gap-2 bg-white text-black hover:bg-green-400 font-semibold px-5 py-2.5 rounded-full transition-colors text-sm"
          >
            Начать бесплатно
          </button>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 lg:px-12 w-full max-w-[1400px] mx-auto py-16 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">

          {/* Left Hero Text */}
          <div className="space-y-8 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs md:text-sm font-medium tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Новый курс для начинающих доступен
              </div>

              <h1 className="font-['Manrope'] text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6">
                Язык жестов <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                  доступен каждому
                </span>
              </h1>

              <p className="text-zinc-400 text-lg md:text-xl max-w-lg leading-relaxed">
                Современная платформа для изучения жестового языка. Расширяйте границы общения и тренируйтесь.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <button
                onClick={() => navigate('/register')}
                className="group relative px-8 py-4 bg-green-500 text-black font-semibold rounded-full overflow-hidden flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 text-base">Перейти к обучению</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>

          {/* Right Features Grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col gap-6 w-full max-w-lg lg:ml-auto"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md hover:bg-zinc-900/80 hover:border-green-500/30 transition-all flex gap-5 group"
              >
                <div className="shrink-0 w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-green-500/10 transition-colors">
                  <feature.icon className="text-zinc-400 group-hover:text-green-500 transition-colors" size={26} />
                </div>
                <div>
                  <h3 className="font-['Manrope'] font-bold text-lg text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </main>

    </div>
  );
}
