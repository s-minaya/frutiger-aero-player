/**
 * Llamadas a la API de letras de canciones
 *
 * Usamos lyrics.ovh — gratuita, sin API key, sin autenticación.
 *
 * Ref: https://lyricsovh.docs.apiary.io/
 */

/**
 * Obtiene la letra de una canción.
 *
 * @param {string} artist — nombre del artista
 * @param {string} title — título de la canción
 * @returns {string} letra de la canción
 * @throws {Error} si no encuentra la letra o hay un error de red
 */
export async function getLyrics(artist, title) {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Letra no disponible");
  }

  const data = await response.json();

  if (!data.lyrics) {
    throw new Error("Letra no disponible");
  }

  return data.lyrics;
}
