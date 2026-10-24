import React, { useState, useEffect, useCallback } from 'react';

const GRID_SIZE = 16; // 4x4
const INITIAL_TIME = 2000; // 5 segundos para la oleada

export default function ReflexGridGame({ onBackToMenu }) {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [activeGreens, setActiveGreens] = useState([]);
  const [activeReds, setActiveReds] = useState([]);
  const [gameStatus, setGameStatus] = useState('IDLE'); // 'IDLE' | 'PLAYING' | 'GAME_OVER'
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);

  // Configuración de celdas según el nivel
  const getBatchConfig = (currentLevel) => {
  if (currentLevel === 1) return { greens: 1, reds: 0, time: 5000 };
  if (currentLevel === 2) return { greens: 2, reds: 0, time: 5000 };
  if (currentLevel === 3) return { greens: 3, reds: 1, time: 5000 };
  if (currentLevel === 4) return { greens: Math.floor(Math.random() * 2) + 4, reds: Math.floor(Math.random() * 2) + 1, time: 5000 }; // 4-5 greens, 1-2 reds
  if (currentLevel === 5) return { greens: Math.floor(Math.random() * 2) + 5, reds: Math.floor(Math.random() * 4) + 1, time: 5000 }; // 5-6 greens, 1-4 reds
  if (currentLevel === 6) return { greens: 6, reds: Math.floor(Math.random() * 3) + 2, time: 5000 }; // 6 greens, 2-4 reds
  if (currentLevel === 7) return { greens: Math.floor(Math.random() * 2) + 6, reds: Math.floor(Math.random() * 3) + 3, time: 4500 }; // 6-7 greens, 3-5 reds
  if (currentLevel === 8) return { greens: 7, reds: Math.floor(Math.random() * 2) + 4, time: 4000 }; // 7 greens, 4-5 reds
  if (currentLevel === 9) return { greens: Math.floor(Math.random() * 2) + 7, reds: Math.floor(Math.random() * 3) + 4, time: 3500 }; // 7-8 greens, 4-6 reds
  
  // Nivel 10 y superior (Modo Extremo)
  return { greens: 8, reds: Math.floor(Math.random() * 2) + 5, time: 3000 }; // 8 greens, 5-6 reds, 3s de tiempo
};

  // Generar nueva oleada
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
    setTimeLeft(INITIAL_TIME);
  }, []);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setGameStatus('PLAYING');
    spawnNewBatch(1);
  };

  // Temporizador global de la oleada
  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          setGameStatus('GAME_OVER');
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameStatus, activeGreens]);

  // Manejo de clics
  const handleCellClick = (index) => {
    if (gameStatus !== 'PLAYING') return;

    // Si toca una roja -> Game Over
    if (activeReds.includes(index)) {
      setGameStatus('GAME_OVER');
      return;
    }

    // Si toca una verde correcta
    if (activeGreens.includes(index)) {
      const updatedGreens = activeGreens.filter((g) => g !== index);
      setActiveGreens(updatedGreens);

      // Si completa la oleada
      if (updatedGreens.length === 0) {
        const newScore = score + 1;
        setScore(newScore);

        // Calcular nuevo nivel basado en la puntuación acumulada
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

    // Si pulsa celda vacía u otra incorrecta -> Game Over
    setGameStatus('GAME_OVER');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <button 
          onClick={onBackToMenu}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-all"
        >
          ← Volver al Menú
        </button>
        <div className="text-slate-400 text-sm">Nivel: <strong className="text-cyan-400">{level}</strong></div>
        <div className="text-slate-400 text-sm">Puntuación: <strong className="text-cyan-400">{score}</strong></div>
      </div>

      {gameStatus === 'PLAYING' && (
        <div className="w-full max-w-md bg-slate-800 h-2 rounded-full mb-6 overflow-hidden">
          <div 
            className="bg-cyan-400 h-full transition-all duration-100"
            style={{ width: `${(timeLeft / INITIAL_TIME) * 100}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full aspect-square mb-6">
        {Array.from({ length: GRID_SIZE }).map((_, index) => {
          const isGreen = activeGreens.includes(index);
          const isRed = activeReds.includes(index);

          let cellStyle = 'bg-slate-800 hover:bg-slate-700 opacity-80';
          if (gameStatus === 'PLAYING') {
            if (isGreen) cellStyle = 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] scale-105';
            if (isRed) cellStyle = 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.8)] scale-105';
          }

          return (
            <button
              key={index}
              disabled={gameStatus !== 'PLAYING'}
              onClick={() => handleCellClick(index)}
              className={`w-full h-full rounded-xl transition-all duration-150 transform active:scale-95 ${cellStyle}`}
            />
          );
        })}
      </div>

      {gameStatus !== 'PLAYING' && (
        <div className="flex flex-col items-center justify-center bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center max-w-sm w-full shadow-xl">
          <h2 className="text-xl font-bold mb-2">
            {gameStatus === 'IDLE' ? 'Modo Arcade: Oleadas' : '¡Juego Terminado!'}
          </h2>
          {gameStatus === 'GAME_OVER' && (
            <p className="text-slate-400 mb-6 text-sm">Puntuación final: <strong className="text-white">{score}</strong></p>
          )}
          <button
            onClick={startGame}
            className="w-full py-3 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg"
          >
            {gameStatus === 'IDLE' ? 'Comenzar Partida' : 'Jugar de Nuevo'}
          </button>
        </div>
      )}
    </div>
  );
}