import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  // Configuración del juego
  const [gridSize, setGridSize] = useState(4); // Empieza en 4x4
  const [activeTile, setActiveTile] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [speed, setSpeed] = useState(1200); // Milisegundos que dura encendido
  const [gameState, setGameState] = useState('IDLE'); // 'IDLE', 'PLAYING', 'GAME_OVER'

  const timerRef = useRef(null);

  // Reproductor de tonos mediante Web Audio API (sin archivos externos)
  const playTone = (frequency, type = 'sine', duration = 150) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      console.error("Audio not supported or blocked", e);
    }
  };

  // Iniciar la partida
  const startGame = () => {
    setGridSize(4);
    setScore(0);
    setStreak(0);
    setSpeed(1200);
    setGameState('PLAYING');
    triggerNextTile(4, 1200);
  };

  // Seleccionar la siguiente casilla aleatoria
  const triggerNextTile = (currentGridSize, currentSpeed) => {
    const totalTiles = currentGridSize * currentGridSize;
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * totalTiles);
    } while (nextIndex === activeTile && totalTiles > 1);

    setActiveTile(nextIndex);
    playTone(400, 'sine', 100);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      // Si pasa el tiempo y no pulsa -> Game Over
      playTone(150, 'sawtooth', 300);
      setGameState('GAME_OVER');
      setActiveTile(null);
    }, currentSpeed);
  };

  // Manejar el clic en una casilla
  const handleTileClick = (index) => {
    if (gameState !== 'PLAYING') return;

    if (index === activeTile) {
      // Acierto
      clearTimeout(timerRef.current);
      playTone(600, 'sine', 150);

      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);

      if (newScore > highScore) {
        setHighScore(newScore);
      }

      // Progresión de dificultad y tamaño del tablero
      let currentSpeed = speed;
      let currentGrid = gridSize;

      if (newStreak % 5 === 0) {
        // Cada 5 aciertos aumentamos velocidad
        currentSpeed = Math.max(400, speed - 150);
        setSpeed(currentSpeed);
      }

      if (newStreak % 15 === 0 && currentGrid < 10) {
        // Cada 15 aciertos ampliamos el tablero (+1 fila y columna hasta 10x10)
        currentGrid = gridSize + 1;
        setGridSize(currentGrid);
        playTone(880, 'triangle', 300);
      }

      triggerNextTile(currentGrid, currentSpeed);
    } else {
      // Fallo al pulsar cuadro incorrecto
      clearTimeout(timerRef.current);
      playTone(120, 'sawtooth', 300);
      setGameState('GAME_OVER');
      setActiveTile(null);
    }
  };

  // Limpiar temporizador al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
      <h1 className="text-3xl font-bold mb-2 tracking-wider text-cyan-400">REFLEX GRID</h1>
      <p className="text-slate-400 mb-6 text-sm">Tablero actual: {gridSize}x{gridSize} | Puntuación: {score}</p>

      {/* Panel de Puntuación */}
      <div className="flex gap-6 mb-6 text-sm font-semibold">
        <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
          Puntuación: <span className="text-cyan-400">{score}</span>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
          Récord: <span className="text-amber-400">{highScore}</span>
        </div>
      </div>

      {/* Área del Tablero Dinámico */}
      <div 
        className="grid gap-2 p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl max-w-md w-full aspect-square mb-6"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const isActive = gameState === 'PLAYING' && index === activeTile;
          return (
            <button
              key={index}
              disabled={gameState !== 'PLAYING'}
              onClick={() => handleTileClick(index)}
              className={`w-full h-full rounded-lg transition-all duration-100 transform active:scale-95 ${
                isActive 
                  ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] scale-105' 
                  : 'bg-slate-800 hover:bg-slate-700 opacity-80'
              }`}
            />
          );
        })}
      </div>

      {/* Pantalla de Inicio / Game Over */}
      {gameState !== 'PLAYING' && (
        <div className="flex flex-col items-center justify-center bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center max-w-sm w-full shadow-xl">
          <h2 className="text-xl font-bold mb-4">
            {gameState === 'IDLE' ? '¿Listo para probar tus reflejos?' : '¡Juego Terminado!'}
          </h2>
          {gameState === 'GAME_OVER' && (
            <p className="text-slate-400 mb-6 text-sm">Puntuación final: <strong className="text-white">{score}</strong></p>
          )}
          <button
            onClick={startGame}
            className="w-full py-3 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg"
          >
            {gameState === 'IDLE' ? 'Comenzar Partida' : 'Jugar de Nuevo'}
          </button>
        </div>
      )}
    </div>
  );
}