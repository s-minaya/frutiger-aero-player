/**
 * client.js — Cliente base para todas las llamadas a la Spotify Web API
 *
 * Este archivo es el único punto de entrada para comunicarse con Spotify.
 * Todas las llamadas de la app pasan por spotifyFetch() — nunca se usa
 * fetch() directamente para llamar a la API.
 *
 * Qué gestiona automáticamente para que el resto de la app no tenga
 * que preocuparse:
 *
 * 1. AUTENTICACIÓN — inyecta el token en cada petición y lo refresca
 *    silenciosamente si ha expirado antes de hacer la llamada
 *
 * 2. RATE LIMITING — si Spotify devuelve 429 (demasiadas peticiones),
 *    espera el tiempo indicado y reintenta automáticamente hasta 3 veces
 *
 * 3. ERRORES HTTP — convierte los códigos de error en excepciones con
 *    mensajes descriptivos que los componentes pueden mostrar al usuario
 *
 * 4. LOGOUT FORZADO — si el token es inválido (401) o no se puede
 *    refrescar, limpia la sesión y redirige al login
 */

import { getValidAccessToken, clearTokens } from "../auth/tokenManager.js";

const BASE_URL = "https://api.spotify.com/v1";

/**
 * Número máximo de reintentos ante un error 429 (rate limiting).
 * Con backoff exponencial los tiempos serían: 1s, 2s, 4s antes de rendirse.
 * (asumiendo Retry-After: 1 — en tests usamos Retry-After: 0)
 */
const MAX_RETRIES = 3;

/**
 * Wrapper de fetch para la Spotify Web API.
 *
 * Uso básico:
 *   const user = await spotifyFetch('/me')
 *   const results = await spotifyFetch('/search?q=radiohead&type=track&limit=10')
 *
 * @param {string} path     - Ruta relativa al BASE_URL, con query string si hace falta
 * @param {object} options  - Opciones de fetch estándar (method, body, headers extra...)
 * @param {number} attempt  - Uso interno para contar reintentos — no pasar manualmente
 */
export async function spotifyFetch(path, options = {}, attempt = 0) {
  // Paso 1: obtenemos un token válido antes de hacer la llamada.
  // getValidAccessToken() lo refresca automáticamente si ha expirado.
  // Si no puede obtenerlo (no hay refresh token, fallo de red...) lanza un error.
  let token;
  try {
    token = await getValidAccessToken();
  } catch {
    // Sin token no podemos hacer nada — forzamos logout y recarga
    clearTokens();
    window.location.reload();
    return;
  }

  // Paso 2: hacemos la llamada inyectando el token en el header Authorization.
  // No añadimos Content-Type por defecto — en peticiones GET Spotify lo rechaza
  // con 400. Solo se añadiría en POST/PUT con body JSON.
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers, // permite sobreescribir o añadir headers desde el caller
    },
  });

  // ── Rate limiting (429) ────────────────────────────────────────────────────
  // Spotify devuelve 429 cuando hacemos demasiadas peticiones.
  // El header Retry-After indica cuántos segundos esperar.
  // Usamos exponential backoff: retryAfter * 1000 * 2^attempt
  // Ejemplo con Retry-After: 1 → esperas 1s, 2s, 4s en cada reintento.
  if (response.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = Number(response.headers.get("Retry-After") || 1);
    const backoff = retryAfter * 1000 * Math.pow(2, attempt);
    await sleep(backoff);
    // Llamada recursiva incrementando el contador de intentos
    return spotifyFetch(path, options, attempt + 1);
  }

  // ── Token inválido o expirado (401) ────────────────────────────────────────
  // Si llegamos aquí con 401 significa que el token no es válido y
  // getValidAccessToken() no pudo refrescarlo (ya lo habría hecho antes).
  // La única solución es forzar un nuevo login.
  if (response.status === 401) {
    clearTokens();
    window.location.reload();
    return;
  }

  // ── Otros errores HTTP ────────────────────────────────────────────────────
  // Para cualquier otro error (400, 403, 404, 500...) extraemos el mensaje
  // de error que Spotify incluye en el body JSON y lo lanzamos como excepción.
  // Los componentes pueden capturarlo y mostrarlo al usuario.
  if (!response.ok) {
    console.warn("Error status:", response.status, "url:", response.url);
    let message = `Spotify API error: ${response.status}`;
    try {
      const err = await response.json();
      message = err?.error?.message || message;
    } catch {
      // La respuesta no era JSON
    }
    throw new SpotifyApiError(message, response.status);
  }

  // ── 204 No Content ────────────────────────────────────────────────────────
  // Algunos endpoints (play, pause, siguiente...) devuelven 204 sin body.
  // response.json() fallaría en ese caso — devolvemos null explícitamente.
  // 204 No Content o respuesta sin body
  if (response.status === 204) return null;

  // Comprobamos si hay contenido antes de parsear
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // Spotify devolvió 200 pero con body vacío o no válido
    return null;
  }
}

// ─── Error personalizado ───────────────────────────────────────────────────────

/**
 * Clase de error específica para errores de la API de Spotify.
 *
 * Extiende Error añadiendo el código HTTP (status) para que los
 * componentes puedan reaccionar de forma distinta según el tipo de error.
 *
 * Uso en componentes:
 *   catch (err) {
 *     if (err instanceof SpotifyApiError && err.status === 403) {
 *       // usuario sin permisos
 *     }
 *   }
 */
export class SpotifyApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "SpotifyApiError";
    // El código HTTP (400, 403, 404, 500...) para manejo granular de errores
    this.status = status;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Pausa la ejecución durante ms milisegundos.
 * Usada en el exponential backoff del rate limiting.
 *
 * En tests E2E/integración se usa Retry-After: 0 para que el backoff
 * sea 0ms y los tests no tarden 7 segundos (1s + 2s + 4s).
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
