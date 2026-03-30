import { spotifyFetch } from "./client.js";

/**
 * Busca canciones en Spotify
 * @param {string} query — texto de búsqueda
 * @param {number} limit — número de resultados (por defecto 20)
 */
export async function searchTracks(query, limit = 10) {
  if (!query.trim()) return [];

  const data = await spotifyFetch(
    `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=ES`,
  );
  return data.tracks.items;
}

/**
 * Convierte milisegundos a formato mm:ss
 * @param {number} ms
 */
export function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
