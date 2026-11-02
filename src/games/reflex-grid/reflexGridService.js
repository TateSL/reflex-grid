const STORAGE_KEYS = {
  SCORES: 'reflex_grid_scores',
  PLAYER_NAME: 'reflex_grid_last_player',
};

// Obtener el último nombre de jugador guardado
export const getStoredPlayerName = () => {
  return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
};

// Guardar el nombre del jugador (limitado opcionalmente a 8 caracteres)
export const savePlayerName = (name) => {
  const sanitized = name.slice(0, 8).trim();
  localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, sanitized);
  return sanitized;
};

// Obtener las puntuaciones guardadas (ordenadas de mayor a menor, máximo 10)
export const getHighScores = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCORES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error al leer el ranking:', error);
    return [];
  }
};

// Guardar una nueva puntuación y mantener el top 10
export const saveScoreEntry = (playerName, score, level) => {
  const nameToSave = savePlayerName(playerName || 'ANON');
  const scores = getHighScores();

  const newEntry = {
    id: Date.now(),
    name: nameToSave,
    score,
    level,
    date: new Date().toLocaleDateString(),
  };

  scores.push(newEntry);
  // Ordenar por puntuación descendente y recortar a los 10 mejores
  scores.sort((a, b) => b.score - a.score);
  const top10 = scores.slice(0, 10);

  localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(top10));
  return top10;
};