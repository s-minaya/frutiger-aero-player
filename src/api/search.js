/**
 * search.js — Búsqueda de canciones en la Spotify Web API
 *
 * Ref: GET /search
 * https://developer.spotify.com/documentation/web-api/reference/search
 */

import { spotifyFetch } from "./client.js";

/**
 * Busca canciones en el catálogo de Spotify.
 *
 * Parámetros de la URL:
 * - q: texto de búsqueda codificado con encodeURIComponent para que
 *   caracteres especiales como espacios o & no rompan la URL
 * - type=track: solo buscamos canciones, no álbumes ni artistas
 * - limit: máximo de resultados — en Development Mode el límite es 10.
 *   Spotify devuelve 400 si se envía un valor mayor.
 * - market=ES: filtra por canciones disponibles en España.
 *   Sin este parámetro Spotify a veces devuelve 400.
 *
 * Estructura relevante de cada track en la respuesta:
 * {
 *   id: string,
 *   name: string,                          — título de la canción
 *   duration_ms: number,                   — duración en ms → usar formatDuration()
 *   preview_url: string | null,            — preview de 30s, puede ser null
 *   artists: [{ name: string }],           — usamos artists[0].name
 *   album: {
 *     name: string,
 *     images: [                            — tres tamaños disponibles:
 *       { url, width: 640 },              — grande
 *       { url, width: 300 },              — mediana
 *       { url, width: 64  },              — miniatura — usamos esta (images[2])
 *     ]
 *   }
 * }
 *
 * @param {string} query — texto de búsqueda introducido por el usuario
 * @param {number} limit — número de resultados (máximo 10 en Development Mode)
 */
export async function searchTracks(query, limit = 10) {
  // Evitamos llamadas con query vacía o solo espacios —
  // el debounce de useSearch ya lo controla, pero es una
  // segunda línea de defensa por si se llama directamente
  if (!query.trim()) return [];

  const data = await spotifyFetch(
    `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=ES`,
  );

  // La respuesta envuelve los resultados en data.tracks.items
  return data.tracks.items;
}
