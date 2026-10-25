import React, { useState } from 'react';
import ReflexGridGame from './games/ReflexGridGame';
import packageJson from '../package.json'; // Importación de la versión desde package.json

export default function App() {
  const [selectedGame, setSelectedGame] = useState(null);

  // Si hay un juego seleccionado, renderizamos el componente correspondiente
  if (selectedGame === 'reflex-grid') {
    return <ReflexGridGame onBackToMenu={() => setSelectedGame(null)} />;
  }

  // Menú Principal de la plataforma
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 relative">
      <h1 className="text-4xl font-extrabold mb-2 tracking-wider text-cyan-400">ARCADE HUB</h1>
      <p className="text-slate-400 mb-8 text-sm">Selecciona un juego para poner a prueba tus reflejos</p>

      <div className="grid gap-4 max-w-md w-full mb-8">
        <button
          onClick={() => setSelectedGame('reflex-grid')}
          className="flex flex-col items-start p-6 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-2xl transition-all shadow-lg group"
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