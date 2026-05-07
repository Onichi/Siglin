import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import {
  HandMetal,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface AuthProps {
  mode: 'login' | 'register';
}

export function Auth({ mode }: AuthProps) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();

  // 1. ПРАВИЛЬНО: Хук вызывается внутри компонента
  const { login } = useAppStore();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        // Читаем JSON ровно один раз!
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Ошибка входа');
        }

        // 2. ПРАВИЛЬНО: Используем Zustand для логина, ждем загрузки данных
        await login(data.access_token);

        // Только после полной загрузки пускаем на дашборд
        navigate('/dashboard');

      } else {
        // Регистрация
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            username: username,
            password: password
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const detail = data.detail;
          throw new Error(typeof detail === 'string' ? detail : 'Ошибка регистрации. Проверьте данные.');
        }

        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-['Inter'] flex flex-col justify-center items-center relative p-6">
        {/* Header / Logo */}
        <div className="absolute top-8 left-8 flex items-center gap-3 text-green-500">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20 backdrop-blur-md">
              <HandMetal size={24} className="text-green-500" />
            </div>
            <span className="font-['Manrope'] text-xl font-bold text-white">SigLin</span>
          </Link>
        </div>

        <div className="w-full max-w-md mt-12">
          <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
          >
            <h1 className="font-['Manrope'] text-3xl font-bold text-white mb-2">
              {isLogin ? 'Вход в аккаунт' : 'Создать аккаунт'}
            </h1>
            <p className="text-zinc-400">
              {isLogin
                  ? 'Введите свои данные для доступа к платформе.'
                  : 'Заполните форму ниже, чтобы начать обучение.'}
            </p>
          </motion.div>

          <AnimatePresence>
            {error && (
                <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                >
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-center text-center font-medium">
                    {error}
                  </div>
                </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Имя и фамилия</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-zinc-500" size={20} />
                    <input
                        type="text"
                        placeholder="Анна Смирнова"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                        required
                    />
                  </div>
                </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Email адрес</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-zinc-500" size={20} />
                <input
                    type="email"
                    placeholder="anna@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-300">Пароль</label>
                {isLogin && (
                    <a href="#" className="text-sm text-green-500 hover:text-green-400 transition-colors font-medium">
                      Забыли пароль?
                    </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-zinc-500" size={20} />
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group mt-4"
            >
              {isLoading ? 'Загрузка...' : (isLogin ? 'Войти в систему' : 'Зарегистрироваться')}
              {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 text-center text-zinc-400 text-sm">
            {isLogin ? (
                <p>
                  Нет аккаунта?{' '}
                  <Link to="/register" className="text-green-500 hover:text-green-400 font-semibold transition-colors">
                    Создать аккаунт
                  </Link>
                </p>
            ) : (
                <p>
                  Уже есть аккаунт?{' '}
                  <Link to="/login" className="text-green-500 hover:text-green-400 font-semibold transition-colors">
                    Войти
                  </Link>
                </p>
            )}
          </div>
        </div>
      </div>
  );
}