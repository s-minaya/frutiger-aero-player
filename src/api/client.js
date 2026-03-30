// Cliente base para la Spotify Web API
// Gestiona: autenticación, rate limiting (429), errores y atribución

import { getValidAccessToken, clearTokens } from "../auth/tokenManager.js";

const BASE_URL = "https://api.spotify.com/v1";
const MAX_RETRIES = 3;

/**
 * Fetch con manejo de tokens, reintentos y exponential backoff.
 *
 * @param {string} path  - Ruta relativa, ej: '/me' o '/search?q=...'
 * @param {object} options - Opciones de fetch (method, body, etc.)
 * @param {number} attempt - Uso interno para reintentos
 */
export async function spotifyFetch(path, options = {}, attempt = 0) {
  let token;
  try {
    token = await getValidAccessToken();
  } catch {
    // Si no podemos obtener un token válido, forzamos logout
    clearTokens();
    window.location.reload();
    return;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  // ── Rate limiting (429) ────────────────────────────────────────────────────
  if (response.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = Number(response.headers.get("Retry-After") || 1);
    const backoff = retryAfter * 1000 * Math.pow(2, attempt);
    await sleep(backoff);
    return spotifyFetch(path, options, attempt + 1);
  }

  // ── Token expirado / no autorizado ─────────────────────────────────────────
  if (response.status === 401) {
    clearTokens();
    window.location.reload();
    return;
  }

  // ── Otros errores HTTP ────────────────────────────────────────────────────
  if (!response.ok) {
    let message = `Spotify API error: ${response.status}`;
    try {
      const err = await response.json();
      message = err?.error?.message || message;
    } catch {
      // La respuesta no era JSON, usamos el mensaje genérico
    }
    throw new SpotifyApiError(message, response.status);
  }

  // 204 No Content (ej: play/pause no devuelve cuerpo)
  if (response.status === 204) return null;

  return response.json();
}

// ─── Error personalizado ───────────────────────────────────────────────────────

export class SpotifyApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "SpotifyApiError";
    this.status = status;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
