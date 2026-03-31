import { spotifyFetch } from "./client.js";

/**
 * Obtiene las playlists del usuario actual
 * Ref: GET /me/playlists
 */
export async function getUserPlaylists(limit = 10) {
  const data = await spotifyFetch(`/me/playlists?limit=${limit}`);
  return data.items;
}

/**
 * Obtiene las canciones de una playlist
 * Ref: GET /playlists/{id}/items
 */
export async function getPlaylistTracks(playlistId) {
  const data = await spotifyFetch(`/playlists/${playlistId}/items`);
  return data.items;
}
