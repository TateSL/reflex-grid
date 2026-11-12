import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getStoredPlayerName, 
  getHighScores, 
  saveScoreEntry 
} from './reflexGridService';

const GRID_SIZE = 16; 
const INITIAL_TIME = 2000; 
const MIN_TIME = 800; 
const ERROR_FLASH_DURATION = 1500;

export default function ReflexGridGame({ onBackToMenu, isMusicMuted }) {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [activeGreens, setActiveGreens] = useState([]);
  const [activeReds, setActiveReds] = useState([]);
  
  // Estados de flujo: 'IDLE' | 'COUNTDOWN' | 'PLAYING' | 'ERROR_FLASH' | 'GAME_OVER'
  const [gameStatus, setGameStatus] = useState('IDLE'); 
  const [countdownStep, setCountdownStep] = useState(3); 
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);

  const [errorCellIndex, setErrorCellIndex] = useState(null);
  const [isTimeOutError, setIsTimeOutError] = useState(false);

  const [playerName, setPlayerName] = useState('');
  const [highScores, setHighScores] = useState([]);
  const [viewMode, setViewMode] = useState('MENU');

  const gameplayAudioRef = useRef(null);
  const errorTimeoutRef = useRef(null);
  const countdownTimeoutRef = useRef(null);

  // Inicialización de datos y música de fondo
  useEffect(() => {
    setPlayerName(getStoredPlayerName());
    setHighScores(getHighScores());

    const gameplayPath = `${import.meta.env.BASE_URL}sounds/ArcadeRush.mp3`;
    const audio = new Audio(gameplayPath);
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = 'auto';
    gameplayAudioRef.current = audio;

    return () => {
      if (gameplayAudioRef.current) {
        gameplayAudioRef.current.pause();
        gameplayAudioRef.current = null;
      }
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    };
  }, []);

  const playSystemBeep = (frequency, duration = 150) => {
    if (isMusicMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      console.warn("AudioContext bloqueado o no soportado:", e);
    }
  };

  const playStartBuzzer = () => {
    if (isMusicMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(220, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("AudioContext bloqueado o no soportado:", e);
    }
  };

  useEffect(() => {
    const audio = gameplayAudioRef.current;
    if (!audio) return;

    audio.muted = isMusicMuted;

    if (gameStatus === 'PLAYING') {
      audio.play().catch((err) => console.warn("Autoplay bloqueado:", err));
    } else {
      audio.pause();
      if (gameStatus !== 'ERROR_FLASH') {
        audio.currentTime = 0;
      }
    }
  }, [gameStatus, isMusicMuted]);

  // CONFIGURACIÓN CORREGIDA: Progresión real de celdas por nivel
  const getBatchConfig = (currentLevel) => {
    if (currentLevel === 1) return { greens: 1, reds: 0 };
    if (currentLevel === 2) return { greens: 2, reds: 0 };
    if (currentLevel === 3) return { greens: 3, reds: 1 };
    if (currentLevel === 4) return { greens: 4, reds: 1 };
    if (currentLevel === 5) return { greens: 5, reds: 2 };
    if (currentLevel === 6) return { greens: 6, reds: 2 };
    if (currentLevel === 7) return { greens: 7, reds: 3 };
    if (currentLevel === 8) return { greens: 8, reds: 3 };
    return { 
      greens: Math.min(10, 8 + Math.floor((currentLevel - 8) / 2)), 
      reds: Math.min(5, 3 + Math.floor((currentLevel - 8) / 3)) 
    };
  };

  const spawnNewBatch = useCallback((currentLevel) => {
    const config = getBatchConfig(currentLevel);
    const availableIndices = Array.from({ length: GRID_SIZE }, (_, i) => i);
    
    const newGreens = [];
    for (let i = 0; i < config.greens; i++) {
      if (availableIndices.length === 0) break;
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      newGreens.push(availableIndices.splice(randomIndex, 1)[0]);
    }

    const newReds = [];
    for (let i = 0; i < config.reds; i++) {
      if (availableIndices.length === 0) break;
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      newReds.push(availableIndices.splice(randomIndex, 1)[0]);
    }

    setActiveGreens(newGreens);
    setActiveReds(newReds);

    const calculatedTime = Math.max(MIN_TIME, INITIAL_TIME - (currentLevel - 1) * 120);
    setTimeLeft(calculatedTime);
  }, []);

  const handleGameOver = useCallback((finalScore, finalLevel) => {
    setGameStatus('GAME_OVER');
    setErrorCellIndex(null);
    setIsTimeOutError(false);
    const updated = saveScoreEntry(playerName || 'PLAYER', finalScore, finalLevel);
    setHighScores(updated);
  }, [playerName]);

  const triggerErrorSequence = useCallback(({ cellIndex = null, timeOut = false, finalScore, finalLevel }) => {
    setGameStatus('ERROR_FLASH');
    setErrorCellIndex(cellIndex);
    setIsTimeOutError(timeOut);

    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);

    errorTimeoutRef.current = setTimeout(() => {
      handleGameOver(finalScore, finalLevel);
    }, ERROR_FLASH_DURATION);
  }, [handleGameOver]);

  const startCountdownSequence = () => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);

    setScore(0);
    setLevel(1);
    setErrorCellIndex(null);
    setIsTimeOutError(false);
    setGameStatus('COUNTDOWN');
    setCountdownStep(3);

    playSystemBeep(300, 200);

    countdownTimeoutRef.current = setTimeout(() => {
      setCountdownStep(2);
      playSystemBeep(450, 200);

      countdownTimeoutRef.current = setTimeout(() => {
        setCountdownStep(1);
        playSystemBeep(600, 200);

        countdownTimeoutRef.current = setTimeout(() => {
          playStartBuzzer();
          setGameStatus('PLAYING');
          spawnNewBatch(1);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          triggerErrorSequence({ 
            timeOut: true, 
            finalScore: score, 
            finalLevel: level 
          });
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameStatus, score, level, triggerErrorSequence]);

  const processCellPress = (index) => {
    if (gameStatus !== 'PLAYING') return;

    // Caso 1: Pulsó una celda prohibida (roja)
    if (activeReds.includes(index)) {
      triggerErrorSequence({ cellIndex: index, finalScore: score, finalLevel: level });
      return;
    }

    // Caso 2: Pulsó una celda objetivo (cian/verde)
    if (activeGreens.includes(index)) {
      const updatedGreens = activeGreens.filter((g) => g !== index);
      setActiveGreens(updatedGreens);

      if (updatedGreens.length === 0) {
        const newScore = score + 1;
        setScore(newScore);

        // Escalado de niveles corregido y ampliado
        let newLevel = level;
        if (newScore >= 150) newLevel = 10;      //90
        else if (newScore >= 118) newLevel = 9;  //75
        else if (newScore >= 92) newLevel = 8;   //60
        else if (newScore >= 70) newLevel = 7;   //50
        else if (newScore >= 51) newLevel = 6;   //35
        else if (newScore >= 35) newLevel = 5;   //25
        else if (newScore >= 22) newLevel = 4;   //15
        else if (newScore >= 12) newLevel = 3;   //10
        else if (newScore >= 5) newLevel = 2;  

        setLevel(newLevel);
        spawnNewBatch(newLevel);
      }
      return;
    }

    // Caso 3: Pulsó una celda vacía por error
    triggerErrorSequence({ cellIndex: index, finalScore: score, finalLevel: level });
  };

  const handlePointerDown = (e, index) => {
    e.preventDefault();
    processCellPress(index);
  };

  const currentLevelTime = Math.max(MIN_TIME, INITIAL_TIME - (level - 1) * 120);
  const isBoardFrozen = gameStatus === 'PLAYING' || gameStatus === 'ERROR_FLASH';
  const showModal = gameStatus === 'IDLE' || gameStatus === 'GAME_OVER';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 select-none relative">
      
      {/* CABECERA */}
      <div className="w-full max-w-md flex flex-col items-center mb-5">
        <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-cyan-400 mb-4 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
          REFLEX GRID
        </h1>
        
        <div className="w-full flex justify-around items-center bg-slate-900/90 border border-slate-800 py-3 px-6 rounded-2xl shadow-lg">
          <div className="text-sm sm:text-base font-bold tracking-wider text-slate-400">
            NIVEL: <strong className="text-cyan-400 text-xl sm:text-2xl ml-1.5 font-mono">{level}</strong>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-sm sm:text-base font-bold tracking-wider text-slate-400">
            PUNTOS: <strong className="text-cyan-400 text-xl sm:text-2xl ml-1.5 font-mono">{score}</strong>
          </div>
        </div>
      </div>

      {/* TABLERO DE JUEGO */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full aspect-square mb-4">
        {Array.from({ length: GRID_SIZE }).map((_, index) => {
          const isGreen = activeGreens.includes(index);
          const isRed = activeReds.includes(index);
          const isErrorCell = gameStatus === 'ERROR_FLASH' && errorCellIndex === index;

          let cellStyle = 'bg-slate-800 opacity-80';

          if (gameStatus === 'COUNTDOWN') {
            if (countdownStep === 3) {
              cellStyle = 'bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.8)] scale-95';
            } else if (countdownStep === 2) {
              cellStyle = 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] scale-95';
            } else if (countdownStep === 1) {
              cellStyle = 'bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.95)] scale-100';
            }
          } else if (isBoardFrozen) {
            if (isErrorCell) {
              cellStyle = 'bg-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.95)] animate-arcade-blink z-10';
            } else if (isGreen) {
              cellStyle = 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] scale-105';
            } else if (isRed) {
              cellStyle = 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.8)] scale-105';
            }
          }

          return (
            <button
              key={index}
              disabled={gameStatus !== 'PLAYING'}
              onPointerDown={(e) => handlePointerDown(e, index)}
              className={`w-full h-full rounded-xl transition-all duration-300 transform touch-none ${cellStyle}`}
            />
          );
        })}
      </div>

      {/* BARRA DE TIEMPO */}
      <div className="w-full max-w-md h-2.5 mb-6">
        {isBoardFrozen ? (
          <div className={`w-full h-full rounded-full overflow-hidden ${isTimeOutError ? 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.9)] animate-arcade-blink' : 'bg-slate-800'}`}>
            {!isTimeOutError && (
              <div 
                className="bg-cyan-400 h-full transition-all duration-100"
                style={{ width: `${(timeLeft / currentLevelTime) * 100}%` }}
              />
            )}
          </div>
        ) : (
          <div className="h-full" />
        )}
      </div>

      {/* MODAL FLOTANTE (INICIO / GAME OVER) */}
      {showModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center flex flex-col">
            
            {viewMode === 'MENU' ? (
              <>
                <h2 className="text-xl font-bold mb-1 text-white">
                  {gameStatus === 'IDLE' ? 'Reflex Grid' : '¡Juego Terminado!'}
                </h2>
                {gameStatus === 'GAME_OVER' && (
                  <p className="text-slate-400 mb-4 text-sm">
                    Puntuación final: <strong className="text-cyan-400 text-lg">{score}</strong>
                  </p>
                )}

                <div className="mb-5 text-left">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    NOMBRE JUGADOR (Máx 8 chars):
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                    placeholder="TU NOMBRE"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-center tracking-wider focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={startCountdownSequence}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg cursor-pointer"
                  >
                    {gameStatus === 'IDLE' ? 'Comenzar Partida' : 'Jugar de Nuevo'}
                  </button>

                  <button
                    onClick={() => setViewMode('SCORES')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Ver Puntuaciones 🏆
                  </button>

                  {gameStatus === 'GAME_OVER' && (
                    <button
                      onClick={onBackToMenu}
                      className="w-full py-2.5 bg-slate-950 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      ← Volver al Menú Principal
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 text-cyan-400">Mejores Puntuaciones</h2>
                
                <div className="max-h-60 overflow-y-auto mb-5 space-y-2 pr-1 font-mono text-xs">
                  {highScores.length === 0 ? (
                    <p className="text-slate-500 py-6">No hay registros todavía.</p>
                  ) : (
                    highScores.map((entry, idx) => (
                      <div 
                        key={entry.id} 
                        className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80"
                      >
                        <span className="text-slate-400 font-bold">{idx + 1}. {entry.name}</span>
                        <span className="text-slate-500">Lv.{entry.level}</span>
                        <span className="text-cyan-400 font-bold text-sm">{entry.score} pts</span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setViewMode('MENU')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                >
                  ← Volver
                </button>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}