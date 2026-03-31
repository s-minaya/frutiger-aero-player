/**
 * playlists.js — Llamadas a la API relacionadas con playlists
 *
 * Solo disponible para usuarios Premium — PlaylistPanel muestra
 * un mensaje de bloqueo si isPremium es false antes de llamar
 * a estas funciones.
 *
 * Requiere el scope playlist-read-private para acceder a las
 * playlists privadas del usuario.
 */

import { spotifyFetch } from "./client.js";

/**
 * Obtiene una página de playlists del usuario autenticado.
 * Ref: GET /me/playlists
 * https://developer.spotify.com/documentation/web-api/reference/get-list-users-playlists
 *
 * Esta función no se llama directamente desde los componentes —
 * usePlaylists.js la llama en bucle para obtener TODAS las playlists
 * paginando con el campo next de la respuesta.
 *
 * Estructura relevante de cada playlist en la respuesta:
 * {
 *   id: string,
 *   name: string,
 *   images: [{ url }],     — puede ser array vacío si no tiene portada
 *   tracks: { total }      — no fiable en Development Mode, se ignora
 * }
 *
 * Límite máximo en Development Mode: 10 por petición.
 * usePlaylists.js pagina automáticamente hasta obtenerlas todas.
 *
 * @param {number} limit — resultados por página (máximo 10 en Dev Mode)
 */
export async function getUserPlaylists(limit = 10) {
  const data = await spotifyFetch(`/me/playlists?limit=${limit}`);
  return data.items;
}

/**
 * Obtiene las canciones de una playlist concreta.
 * Ref: GET /playlists/{id}/items
 * https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks
 *
 * IMPORTANTE: usamos /items en vez del deprecado /tracks —
 * requerimiento explícito de los ToS de Spotify.
 *
 * Estructura relevante de cada item en la respuesta:
 * {
 *   added_at: string,      — fecha en que se añadió a la playlist
 *   item: {                — OJO: es "item", no "track" (cambio reciente de la API)
 *     id: string,
 *     name: string,
 *     duration_ms: number,
 *     artists: [{ name }],
 *     album: { images: [...] }
 *   } | null              — null si es un episodio de podcast, hay que filtrarlo
 * }
 *
 * En PlaylistPanel.jsx filtramos los items null con:
 * tracks.map(({ item }) => item ? (...) : null)
 *
 * @param {string} playlistId — ID de la playlist obtenido de getUserPlaylists
 */
export async function getPlaylistTracks(playlistId) {
  const data = await spotifyFetch(`/playlists/${playlistId}/items`);
  return data.items;
}
