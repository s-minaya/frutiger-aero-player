/**
 * Llamadas a la API relacionadas con la reproducción
 *
 * Estas llamadas controlan el reproductor de Spotify en el dispositivo
 * que le indiquemos con device_id — en nuestro caso el SDK del navegador.
 *
 * Requieren los scopes:
 * - user-modify-playback-state: para play, pause, siguiente, anterior
 * - user-read-playback-state: para leer el estado actual
 *
 * Ref: https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback
 */

import { spotifyFetch } from "./client.js";

/**
 * Reproduce una canción en el dispositivo indicado.
 *
 * uris: array de URIs de Spotify — cada canción tiene una URI única
 * con el formato 'spotify:track:ID'. Le decimos a Spotify exactamente
 * qué canción reproducir.
 *
 * device_id: el ID que el SDK nos dio cuando se conectó. Sin esto
 * Spotify no sabe en qué dispositivo reproducir.
 *
 * @param {string} trackUri  - URI de la canción ej: 'spotify:track:abc123'
 * @param {string} deviceId  - ID del dispositivo del SDK
 */
export async function playTrackOnDevice(trackUri, deviceId) {
  await spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uris: [trackUri], // array aunque sea una sola canción
    }),
  });
}

/**
 * Pausa la reproducción en el dispositivo activo.
 */
export async function pausePlayback() {
  await spotifyFetch("/me/player/pause", { method: "PUT" });
}

/**
 * Reanuda la reproducción en el dispositivo activo.
 */
export async function resumePlayback() {
  await spotifyFetch("/me/player/play", { method: "PUT" });
}

/**
 * Salta a la siguiente canción.
 *
 * Actualmente no se usa desde PlayerPanel — la navegación entre
 * canciones se gestiona en PlayerProvider con nextTrack() que
 * mantiene la queue local sincronizada.
 *
 * Se conserva para uso futuro: sincronizar con Spotify cuando el
 * usuario cambia de canción desde otro dispositivo (playerState_changed).
 */
export async function skipToNext() {
  await spotifyFetch("/me/player/next", { method: "POST" });
}

/**
 * Vuelve a la canción anterior.
 *
 * Mismo caso que skipToNext — conservada para sincronización futura
 * con cambios iniciados desde otros dispositivos de Spotify.
 */
export async function skipToPrevious() {
  await spotifyFetch("/me/player/previous", { method: "POST" });
}

/**
 * Ajusta el volumen del dispositivo activo.
 *
 * @param {number} volume - Volumen de 0 a 100 (la API usa 0-100, no 0-1)
 */
export async function setPlayerVolume(volume) {
  await spotifyFetch(
    `/me/player/volume?volume_percent=${Math.round(volume * 100)}`,
    { method: "PUT" },
  );
}
