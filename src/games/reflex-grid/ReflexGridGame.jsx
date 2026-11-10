import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getStoredPlayerName, 
  getHighScores, 
  saveScoreEntry 
} from './reflexGridService';

const GRID_SIZE = 16; 
const INITIAL_TIME = 2000; 
const MIN_TIME = 800; 

export default function ReflexGridGame({ onBackToMenu, isMusicMuted }) {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [activeGreens, setActiveGreens] = useState([]);
  const [activeReds, setActiveReds] = useState([]);
  const [gameStatus, setGameStatus] = useState('IDLE'); // 'IDLE' | 'PLAYING' | 'GAME_OVER'
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);

  const [playerName, setPlayerName] = useState('');
  const [highScores, setHighScores] = useState([]);
  const [viewMode, setViewMode] = useState('MENU'); // 'MENU' | 'SCORES'

  // Referencia para la música exclusiva de este juego (ArcadeRush.mp3)
  const gameplayAudioRef = useRef(null);

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
    };
  }, []);

  // Controlar reproducción y mute de la música de gameplay
  useEffect(() => {
    const audio = gameplayAudioRef.current;
    if (!audio) return;

    audio.muted = isMusicMuted;

    if (gameStatus === 'PLAYING') {
      audio.play().catch((err) => {
        console.warn("Autoplay bloqueado en gameplay:", err);
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [gameStatus, isMusicMuted]);

  const getBatchConfig = (currentLevel) => {
    if (currentLevel === 1) return { greens: 1, reds: 0 };
    if (currentLevel === 2) return { greens: 2, reds: 0 };
    if (currentLevel === 3) return { greens: 3, reds: 1 };
    if (currentLevel === 4) return { greens: Math.floor(Math.random() * 2) + 4, reds: Math.floor(Math.random() * 2) + 1 };
    if (currentLevel === 5) return { greens: Math.floor(Math.random() * 2) + 5, reds: Math.floor(Math.random() * 4) + 1 };
    if (currentLevel === 6) return { greens: 6, reds: Math.floor(Math.random() * 3) + 2 };
    if (currentLevel === 7) return { greens: Math.floor(Math.random() * 2) + 6, reds: Math.floor(Math.random() * 3) + 3 };
    if (currentLevel === 8) return { greens: 7, reds: Math.floor(Math.random() * 2) + 4 };
    if (currentLevel === 9) return { greens: Math.floor(Math.random() * 2) + 7, reds: Math.floor(Math.random() * 3) + 4 };
    return { greens: 8, reds: Math.floor(Math.random() * 2) + 5 };
  };

  const spawnNewBatch = useCallback((currentLevel) => {
    const config = getBatchConfig(currentLevel);
    const availableIndices = Array.from({ length: GRID_SIZE }, (_, i) => i);
    
    const newGreens = [];
    for (let i = 0; i < config.greens; i++) {
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

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setGameStatus('PLAYING');
    spawnNewBatch(1);
  };

  const handleGameOver = useCallback((finalScore, finalLevel) => {
    setGameStatus('GAME_OVER');
    const updated = saveScoreEntry(playerName || 'PLAYER', finalScore, finalLevel);
    setHighScores(updated);
  }, [playerName]);

  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          setScore((currentScore) => {
            setLevel((currentLevel) => {
              handleGameOver(currentScore, currentLevel);
              return currentLevel;
            });
            return currentScore;
          });
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameStatus, activeGreens, handleGameOver]);

  const processCellPress = (index) => {
    if (gameStatus !== 'PLAYING') return;

    if (activeReds.includes(index)) {
      handleGameOver(score, level);
      return;
    }

    if (activeGreens.includes(index)) {
      const updatedGreens = activeGreens.filter((g) => g !== index);
      setActiveGreens(updatedGreens);

      if (updatedGreens.length === 0) {
        const newScore = score + 1;
        setScore(newScore);

        let newLevel = level;
        if (newScore >= 100) newLevel = 10;
        else if (newScore >= 80) newLevel = 9;
        else if (newScore >= 65) newLevel = 8;
        else if (newScore >= 50) newLevel = 7;
        else if (newScore >= 35) newLevel = 6;
        else if (newScore >= 25) newLevel = 5;
        else if (newScore >= 15) newLevel = 4;
        else if (newScore >= 10) newLevel = 3;
        else if (newScore >= 5) newLevel = 2;

        setLevel(newLevel);
        spawnNewBatch(newLevel);
      }
      return;
    }

    handleGameOver(score, level);
  };

  const handlePointerDown = (e, index) => {
    e.preventDefault();
    processCellPress(index);
  };

  const currentLevelTime = Math.max(MIN_TIME, INITIAL_TIME - (level - 1) * 120);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 select-none relative">
      
      {/* CABECERA (Ya sin el botón de mute interno, el control es global) */}
      <div className="w-full max-w-md flex flex-col items-center mb-4">
        <h1 className="text-2xl font-black tracking-widest text-cyan-400 mb-3">REFLEX GRID</h1>
        <div className="w-full flex justify-between items-center">
          <button 
            onClick={onBackToMenu}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-all"
          >
            ← Menú Hub
          </button>
          <div className="flex gap-4 text-sm font-semibold">
            <span className="text-slate-400">Lv: <strong className="text-cyan-400">{level}</strong></span>
            <span className="text-slate-400">Pts: <strong className="text-cyan-400">{score}</strong></span>
          </div>
        </div>
      </div>

      {/* TABLERO DE JUEGO */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full aspect-square mb-4">
        {Array.from({ length: GRID_SIZE }).map((_, index) => {
          const isGreen = activeGreens.includes(index);
          const isRed = activeReds.includes(index);

          let cellStyle = 'bg-slate-800 opacity-80';
          if (gameStatus === 'PLAYING') {
            if (isGreen) cellStyle = 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] scale-105';
            if (isRed) cellStyle = 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.8)] scale-105';
          }

          return (
            <button
              key={index}
              disabled={gameStatus !== 'PLAYING'}
              onPointerDown={(e) => handlePointerDown(e, index)}
              className={`w-full h-full rounded-xl transition-all duration-150 transform active:scale-95 touch-none ${cellStyle}`}
            />
          );
        })}
      </div>

      {/* BARRA DE TIEMPO */}
      <div className="w-full max-w-md h-2 mb-6">
        {gameStatus === 'PLAYING' ? (
          <div className="w-full bg-slate-800 h-full rounded-full overflow-hidden">
            <div 
              className="bg-cyan-400 h-full transition-all duration-100"
              style={{ width: `${(timeLeft / currentLevelTime) * 100}%` }}
            />
          </div>
        ) : (
          <div className="h-full" />
        )}
      </div>

      {/* MODAL FLOTANTE (GAME OVER / IDLE / SCORES) */}
      {gameStatus !== 'PLAYING' && (
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
                    onClick={startGame}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg"
                  >
                    {gameStatus === 'IDLE' ? 'Comenzar Partida' : 'Jugar de Nuevo'}
                  </button>

                  <button
                    onClick={() => setViewMode('SCORES')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
                  >
                    Ver Puntuaciones 🏆
                  </button>
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
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
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