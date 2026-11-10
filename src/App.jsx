import React, { useState, useEffect, useRef } from 'react';
import ReflexGridGame from './games/reflex-grid/ReflexGridGame';
import packageJson from '../package.json';

export default function App() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const menuAudioRef = useRef(null);

  // Inicializar la música del menú principal a nivel global
  useEffect(() => {
    const menuPath = `${import.meta.env.BASE_URL}sounds/SoftFadeOut2Menu.mp3`;
    const audio = new Audio(menuPath);
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = 'auto';
    menuAudioRef.current = audio;

    // Intentar reproducir la música del menú al iniciar la PWA
    audio.play().catch((err) => {
      console.warn("Reproducción automática bloqueada en el menú principal:", err);
    });

    return () => {
      if (menuAudioRef.current) {
        menuAudioRef.current.pause();
        menuAudioRef.current = null;
      }
    };
  }, []);

  // Sincronizar el estado de silencio (mute) y pausar cuando se entra a un juego
  useEffect(() => {
    const audio = menuAudioRef.current;
    if (!audio) return;

    audio.muted = isMusicMuted;

    if (selectedGame !== null) {
      // Si el usuario abre un juego, pausamos la música del menú general
      audio.pause();
    } else {
      // Si vuelve al menú principal, reanudamos la música del menú
      audio.play().catch((err) => console.warn("No se pudo reanudar la música de menú:", err));
    }
  }, [selectedGame, isMusicMuted]);

  // Si hay un juego seleccionado, renderizamos el componente pasándole el estado de mute global
  if (selectedGame === 'reflex-grid') {
    return (
      <ReflexGridGame 
        isMusicMuted={isMusicMuted} 
        onBackToMenu={() => setSelectedGame(null)} 
      />
    );
  }

  // Menú Principal (Hub)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 relative">
      
      {/* Botón de Audio Global en la esquina superior derecha */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setIsMusicMuted(!isMusicMuted)}
          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
          title={isMusicMuted ? "Activar música" : "Silenciar música"}
        >
          <span>{isMusicMuted ? "🔇" : "🔊"}</span>
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">
            {isMusicMuted ? "Silenciado" : "Música ON"}
          </span>
        </button>
      </div>

      <h1 className="text-4xl font-extrabold mb-2 tracking-wider text-cyan-400">ARCADE HUB</h1>
      <p className="text-slate-400 mb-8 text-sm">Selecciona un juego para poner a prueba tus reflejos</p>

      <div className="grid gap-4 max-w-md w-full mb-8">
        <button
          onClick={() => setSelectedGame('reflex-grid')}
          className="flex flex-col items-start p-6 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-2xl transition-all shadow-lg group text-left"
        >
          <h2 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">Reflex Grid (Arcade)</h2>
          <p className="text-slate-400 text-sm mt-1">Limpia las celdas verdes por oleadas y evita las celdas rojas prohibidas.</p>
        </button>

        {/* Plantilla para futuros juegos */}
        <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-2xl text-slate-600 cursor-not-allowed">
          <h2 className="text-xl font-bold">Próximamente</h2>
          <p className="text-xs mt-1">Más juegos en desarrollo...</p>
        </div>
      </div>

      {/* Indicador de Versión en el pie de página */}
      <footer className="text-xs text-slate-600 font-mono">
        v{packageJson.version}
      </footer>
    </div>
  );
}