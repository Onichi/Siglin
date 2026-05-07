import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import Webcam from 'react-webcam';
import {
  ArrowLeft, PlayCircle, Square, CheckCircle2, BrainCircuit, Trophy, CameraOff, Video
} from 'lucide-react';
import { useAppStore, DEFAULT_GESTURE_PLACEHOLDER } from '../store/useAppStore';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Lesson() {
  const { id } = useParams(); // ID урока из URL
  const navigate = useNavigate();
  const { fetchGlobalData, userData, } = useAppStore();

  const isAdmin = userData?.role === 'admin';

  // Данные урока
  const [lessonData, setLessonData] = useState<any>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);

  // Прогресс
  const [currentGestureIndex, setCurrentGestureIndex] = useState(0);

  // Рефы для камеры, канваса и WebSocket
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Состояния камеры и ИИ
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [debugData, setDebugData] = useState<string>("");

  // UI Попапы
  const [showIntermediateSuccess, setShowIntermediateSuccess] = useState(false);
  const [isFinalSuccess, setIsFinalSuccess] = useState(false);

  // Загружаем детали урока при входе на страницу
  useEffect(() => {
    const fetchLessonDetails = async () => {
      try {
        const res = await fetch(`/api/lessons/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          setLessonData(await res.json());
        }
      } catch (error) {
        console.error("Ошибка загрузки урока:", error);
      } finally {
        setIsLoadingLesson(false);
      }
    };
    fetchLessonDetails();

    // Очистка при выходе со страницы
    return () => stopRecording();
  }, [id]);

  // Вычисляемые переменные для текущего жеста
  const lessonGestures = lessonData?.gestures || [];
  const totalGestures = lessonGestures.length;
  const currentLessonGesture = lessonGestures[currentGestureIndex]?.gesture;

  const progressPercent = totalGestures > 0 ? (currentGestureIndex / totalGestures) * 100 : 0;

  // --- ВАЖНО ДЛЯ WEBSOCKET: Рефы для обхода замыканий ---
  const expectedGestureRef = useRef<string | null>(null);
  const currentIndexRef = useRef(0);
  const totalGesturesRef = useRef(0);

  useEffect(() => {
    expectedGestureRef.current = currentLessonGesture?.name || null;
    currentIndexRef.current = currentGestureIndex;
    totalGesturesRef.current = totalGestures;
  }, [currentLessonGesture, currentGestureIndex, totalGestures]);


  // --- ЛОГИКА WEBSOCKET ---
  const captureAndSend = useCallback(() => {
    if (!webcamRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === 4) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 640;
        canvas.height = 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Frame = canvas.toDataURL('image/jpeg', 0.4);
        wsRef.current.send(JSON.stringify({ image: base64Frame }));
      }
    }
  }, []);

  const startRecording = () => {
    if (!isCameraActive) return;
    if (wsRef.current) wsRef.current.close();

    // 1. Автоматически выбираем wss (secure), если зашли через https (ngrok)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // 2. ГЛАВНЫЙ ФИКС:
    // Если в адресе браузера есть "ngrok", используем текущий адрес (window.location.host).
    // Vite Proxy сам перенаправит этот сокет на бэкенд благодаря ws: true в конфиге.
    const host = window.location.host.includes('ngrok-free.dev')
        ? window.location.host
        : (import.meta.env.DEV ? 'localhost:8000' : window.location.host);

    const wsUrl = `${protocol}//${host}/api/recognize/stream`;

    console.log("Attempting WebSocket connection to:", wsUrl);

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket Connected ✅");
      setIsRecording(true);
      intervalRef.current = setInterval(captureAndSend, 100);
    };

    socket.onmessage = (event) => {
      try {
        setDebugData(event.data);
        const data = JSON.parse(event.data);
        if (data.status === 'success') {
          setPrediction(data.gesture);
          setConfidence(Math.round(data.confidence * 100));

          if (data.gesture === expectedGestureRef.current && data.confidence > 0.8) {
            handleSuccess();
          }
        }
      } catch (error) {
        console.error("Ошибка парсинга:", error);
      }
    };

    socket.onclose = (e) => {
      console.log("WebSocket Closed ❌", e.reason);
      stopRecordingState();
    };

    socket.onerror = (err) => {
      console.error("WebSocket Error ⚠️", err);
      stopRecordingState();
    };
  };

  const stopRecordingState = () => {
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPrediction(null);
    setConfidence(0);
    setDebugData("");
  };

  const stopRecording = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopRecordingState();
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopRecording();
      setIsCameraActive(false);
    } else {
      setIsCameraActive(true);
    }
  };

  // --- ОБРАБОТКА УСПЕХА ---
  const handleSuccess = async () => {
    stopRecording(); // Выключаем распознавание сразу при правильном жесте

    const currentIndex = currentIndexRef.current;
    const total = totalGesturesRef.current;

    if (currentIndex < total - 1) {
      // Это НЕ последний жест
      setShowIntermediateSuccess(true);
      setTimeout(() => {
        setShowIntermediateSuccess(false);
        setCurrentGestureIndex(prev => prev + 1);
      }, 2000);
    } else {
      // Это ПОСЛЕДНИЙ жест - завершаем урок
      setIsFinalSuccess(true);
      try {
        await fetch(`/api/lessons/${id}/complete`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        await fetchGlobalData(); // Тихо обновляем прогресс (без мерцания страницы)
      } catch (error) {
        console.error("Ошибка сохранения прогресса:", error);
      }
    }
  };


  // --- СОСТОЯНИЯ ЗАГРУЗКИ ---
  if (isLoadingLesson) {
    return <div className="h-screen bg-[#0a0a0a] flex items-center justify-center text-zinc-500 font-['Manrope']">Загрузка урока...</div>;
  }

  if (!lessonData || totalGestures === 0) {
    return (
        <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-zinc-500 font-['Manrope']">
          <h2 className="text-xl mb-4 text-white">В этом уроке пока нет жестов</h2>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-zinc-800 rounded-xl text-white">Вернуться назад</button>
        </div>
    );
  }

  // --- ОСНОВНОЙ РЕНДЕР ---
  return (
      <div className="flex flex-col h-[100dvh] bg-[#0a0a0a] text-zinc-100 font-['Inter'] relative">

        {/* Полоса прогресса в самом верху */}
        <div className="absolute top-0 left-0 h-1 bg-green-500 transition-all duration-700 ease-out z-50" style={{ width: `${progressPercent}%` }} />

        <header className="h-20 border-b border-zinc-800/80 flex items-center justify-between px-6 lg:px-10 shrink-0 bg-[#0a0a0a] z-10 pt-1">
          <div className="flex items-center gap-4">
            <button
                onClick={() => navigate('/dashboard')}
                className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="text-xs text-green-500 font-semibold uppercase tracking-wider mb-1">
                Урок: {lessonData.title}
              </div>
              <h1 className="font-['Manrope'] text-xl font-bold text-white leading-none">
                Жест «{currentLessonGesture?.name}»
              </h1>
            </div>
          </div>

          {/* Текстовый счетчик прогресса справа */}
          <div className="hidden sm:block text-zinc-500 font-medium bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
            {currentGestureIndex + 1} из {totalGestures}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 flex flex-col">
          <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6">

            {/* Левая часть: Референс */}
            <div className="flex-1 min-h-[400px] md:min-h-0 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col relative shadow-2xl">
              <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                <BrainCircuit size={16} className="text-blue-400" />
                <span className="text-sm font-medium text-zinc-200">Образец</span>
              </div>

              <div className="flex-1 bg-zinc-800 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                      key={currentLessonGesture?.id || 'placeholder'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 w-full h-full"
                  >
                    <img
                        src={currentLessonGesture?.gif_url || DEFAULT_GESTURE_PLACEHOLDER}
                        alt={currentLessonGesture?.name || "Gesture placeholder"}
                        className="w-full h-full object-cover block"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-6 bg-zinc-900 border-t border-zinc-800 shrink-0">
                <h3 className="text-lg font-bold text-white mb-2">Описание движения</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {currentLessonGesture?.description || "Повторите движение руки перед камерой, следя за положением пальцев."}
                </p>
              </div>
            </div>

            {/* Правая часть: Камера и ИИ */}
            <div className="flex-1 flex flex-col gap-6">

              {/* 🔥 ДИНАМИЧЕСКИЙ ГЛАВНЫЙ КОНТЕЙНЕР КАМЕРЫ 🔥 */}
              <div className={`flex-1 min-h[400px] lg:min-h-0 bg-[#0a0a0a] border rounded-3xl overflow-hidden relative transition-all duration-300 ${
                  showIntermediateSuccess || isFinalSuccess
                      ? 'ring-4 ring-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]'
                      : 'border-zinc-800 shadow-2xl'
              }`}>

                {/* Рендеринг Веб-камеры или Заглушки */}
                {isCameraActive ? (
                    <>
                      <Webcam
                          ref={webcamRef}
                          audio={false}
                          videoConstraints={{ facingMode: "user" }}
                          className="w-full h-full object-cover"
                          mirrored={true}
                          playsInline
                      />
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600">
                      <CameraOff size={56} className="mb-4 opacity-50" />
                      <p className="text-lg font-medium text-zinc-500">Камера отключена</p>
                    </div>
                )}

                {/* Оверлей состояния ИИ */}
                {isCameraActive && (
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
                      <div className={`px-4 py-2 rounded-xl backdrop-blur-md border flex items-center gap-2 transition-colors ${
                          isRecording ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-black/60 border-white/10 text-zinc-400'
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
                        <span className="text-sm font-medium">{isRecording ? 'ИИ анализирует...' : 'Готово к практике'}</span>
                      </div>

                      <AnimatePresence>
                        {isRecording && prediction && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`px-5 py-3 rounded-2xl backdrop-blur-md border flex flex-col items-end ${
                                    prediction === expectedGestureRef.current ? 'bg-green-500/20 border-green-500/50' : 'bg-zinc-900/80 border-zinc-700/50'
                                }`}
                            >
                              <span className="text-xs text-zinc-400 mb-1">ИИ видит:</span>
                              <div className="flex items-baseline gap-2">
                              <span className={`text-2xl font-bold font-['Manrope'] ${prediction === expectedGestureRef.current ? 'text-green-400' : 'text-white'}`}>
                                {prediction}
                              </span>
                                <span className="text-xs text-zinc-500">{confidence}%</span>
                              </div>
                            </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                )}

                {/* ПАНЕЛЬ ДЕБАГА (Только для Админа) */}
                {isRecording && isAdmin && (
                    <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md border border-green-500/30 p-3 rounded-xl z-20 max-w-sm w-full pointer-events-none">
                      <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Поток WebSocket (Admin)
                      </span>
                      <div className="font-mono text-xs text-zinc-300 break-all overflow-hidden h-12 flex items-end">
                        {debugData ? debugData : "Ожидание пакетов..."}
                      </div>
                    </div>
                )}

                {/* ПРОМЕЖУТОЧНЫЙ ПОПАП УСПЕХА (ПЕРЕДХОД К СЛЕДУЮЩЕМУ) */}
                <AnimatePresence>
                  {showIntermediateSuccess && (
                      <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute inset-0 z-20 bg-green-500 backdrop-blur-md flex flex-col items-center justify-center p-6"
                      >
                        <motion.div
                            initial={{ scale: 0.5, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-500/40"
                        >
                          <CheckCircle2 size={40} className="text-black" />
                        </motion.div>
                        <h2 className="text-3xl font-bold font-['Manrope'] text-white mb-2 text-center">Отлично!</h2>
                        <p className="text-green-100 text-center mb-8 max-w-sm">Переходим к следующему жесту...</p>
                      </motion.div>
                  )}
                </AnimatePresence>

                {/* ФИНАЛЬНЫЙ ПОПАП (УРОК ЗАВЕРШЕН) */}
                <AnimatePresence>
                  {isFinalSuccess && (
                      <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
                      >
                        <motion.div
                            initial={{ scale: 0.5, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-500"
                        >
                          <Trophy size={48} className="text-black" />
                        </motion.div>
                        <h2 className="text-4xl font-bold font-['Manrope'] text-white mb-2 text-center">Урок пройден!</h2>
                        <p className="text-green-100 text-center mb-8 max-w-sm">Вы великолепно справились со всеми жестами из этого модуля.</p>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-8 rounded-xl transition-colors flex items-center gap-3 shadow-lg"
                        >
                          <ArrowLeft size={20} />
                          Вернуться к списку уроков
                        </button>
                      </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Панель управления */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shrink-0 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold mb-1">Практика</h4>
                  <p className="text-zinc-500 text-sm hidden sm:block">Повторяйте жест, пока нейросеть не засчитает его.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                      onClick={toggleCamera}
                      className={`p-4 rounded-xl border transition-all ${
                          !isCameraActive
                              ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                              : 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'
                      }`}
                      title={isCameraActive ? "Выключить камеру" : "Включить камеру"}
                  >
                    {isCameraActive ? <Video size={20} /> : <CameraOff size={20} />}
                  </button>

                  {!isFinalSuccess && (
                      <button
                          onClick={toggleRecording}
                          disabled={!isCameraActive || showIntermediateSuccess}
                          className={`flex items-center gap-2 px-6 sm:px-8 py-4 rounded-xl font-bold transition-all ${
                              (!isCameraActive || showIntermediateSuccess)
                                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-transparent'
                                  : isRecording
                                      ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                                      : 'bg-white text-black hover:bg-zinc-200 border border-transparent shadow-lg'
                          }`}
                      >
                        {isRecording ? <Square size={20} className="fill-current" /> : <PlayCircle size={20} />}
                        <span className="hidden sm:inline">{isRecording ? 'Остановить' : 'Начать практику'}</span>
                      </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
  );
}