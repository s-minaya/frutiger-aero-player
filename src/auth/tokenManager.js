/**
 * tokenManager.js — Gestión del ciclo de vida de los tokens OAuth
 *
 * Este archivo es el núcleo de la autenticación. Centraliza todo lo
 * relacionado con los tokens en localStorage: guardar, recuperar,
 * detectar expiración, refrescar silenciosamente y limpiar.
 *
 * Por qué localStorage y no cookies o sessionStorage:
 * - localStorage persiste entre pestañas y recargas — el usuario
 *   no tiene que hacer login cada vez que recarga la página
 * - sessionStorage se borraría al cerrar la pestaña
 * - Cookies requieren configuración de servidor que no tenemos
 *
 * El Client Secret NUNCA aparece aquí — PKCE no lo necesita.
 * Todo el intercambio de tokens se hace con client_id + code_verifier.
 */

/**
 * Claves de localStorage — centralizadas aquí para evitar typos.
 * El prefijo "sfa_" (spotify-frutiger-aero) evita colisiones con
 * otras apps que puedan estar corriendo en el mismo dominio.
 */
const KEYS = {
  ACCESS_TOKEN: "sfa_access_token",
  REFRESH_TOKEN: "sfa_refresh_token",
  EXPIRES_AT: "sfa_expires_at",
  CODE_VERIFIER: "sfa_code_verifier",
};

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

// ─── Almacenamiento ────────────────────────────────────────────────────────────

/**
 * Guarda los tokens recibidos de Spotify en localStorage.
 *
 * expires_in viene en segundos (normalmente 3600 = 1 hora).
 * Lo convertimos a timestamp absoluto (Date.now() + ms) para poder
 * compararlo directamente con Date.now() en isTokenExpired().
 *
 * El refresh_token NO siempre viene en la respuesta — Spotify solo
 * lo incluye en el intercambio inicial, no en los refrescos posteriores.
 * Por eso solo lo sobreescribimos si viene uno nuevo.
 */
export function saveTokens({ access_token, refresh_token, expires_in }) {
  const expiresAt = Date.now() + expires_in * 1000;
  localStorage.setItem(KEYS.ACCESS_TOKEN, access_token);
  localStorage.setItem(KEYS.EXPIRES_AT, String(expiresAt));
  if (refresh_token) {
    localStorage.setItem(KEYS.REFRESH_TOKEN, refresh_token);
  }
}

/**
 * Elimina todos los tokens del localStorage.
 * Se llama al cerrar sesión (logout) o cuando un token es inválido (401).
 * Después de esto isLoggedIn() devuelve false y el router redirige a /login.
 */
export function clearTokens() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

/**
 * Devuelve el refresh token guardado, o null si no existe.
 * El refresh token no expira (salvo revocación manual por el usuario)
 * y es lo que nos permite renovar el access token sin pedir login.
 */
export function getRefreshToken() {
  return localStorage.getItem(KEYS.REFRESH_TOKEN);
}

/**
 * Guarda el code_verifier durante el flujo PKCE.
 * Se llama en spotifyAuth.js justo antes de redirigir a Spotify,
 * y se recupera en exchangeCodeForTokens() cuando Spotify redirige
 * de vuelta con el code.
 */
export function saveCodeVerifier(verifier) {
  localStorage.setItem(KEYS.CODE_VERIFIER, verifier);
}

/** Recupera el code_verifier guardado durante el inicio del flujo PKCE. */
export function getCodeVerifier() {
  return localStorage.getItem(KEYS.CODE_VERIFIER);
}

/**
 * Elimina el code_verifier tras canjearlo por tokens.
 * El verifier es de un solo uso — una vez usado no debe poder reutilizarse.
 */
export function clearCodeVerifier() {
  localStorage.removeItem(KEYS.CODE_VERIFIER);
}

// ─── Estado del token ──────────────────────────────────────────────────────────

/**
 * Comprueba si el access token ha expirado.
 *
 * Usamos un margen de 60 segundos antes de la expiración real.
 * Esto evita que una llamada a la API falle porque el token expiró
 * justo durante el viaje de red — lo renovamos antes de tiempo.
 *
 * Devuelve true (expirado) si:
 * - No hay fecha de expiración guardada
 * - El timestamp actual supera expiresAt - 60 segundos
 */
export function isTokenExpired() {
  const expiresAt = Number(localStorage.getItem(KEYS.EXPIRES_AT));
  if (!expiresAt) return true;
  return Date.now() > expiresAt - 60_000;
}

/**
 * Comprueba si el usuario está autenticado.
 * Requiere AMBOS tokens — sin refresh token no podemos renovar
 * la sesión cuando el access token expire en una hora.
 *
 * Nota: no comprueba si el token es válido en Spotify,
 * solo si existe en localStorage. La validación real ocurre
 * en la primera llamada a la API.
 */
export function isLoggedIn() {
  return (
    !!localStorage.getItem(KEYS.ACCESS_TOKEN) &&
    !!localStorage.getItem(KEYS.REFRESH_TOKEN)
  );
}

// ─── Refresco automático ───────────────────────────────────────────────────────

/**
 * Punto de entrada único para obtener un access token válido.
 * Toda la app pide tokens a través de esta función — nunca
 * directamente de localStorage.
 *
 * Lógica:
 * 1. Si el token no ha expirado → devuelve el del localStorage
 * 2. Si ha expirado → llama a Spotify con el refresh token
 * 3. Guarda los nuevos tokens y devuelve el nuevo access token
 *
 * El usuario nunca nota el refresco — ocurre de forma silenciosa
 * antes de cada llamada a la API que lo necesite.
 *
 * Lanza un error si no hay refresh token o si el refresco falla,
 * lo que provoca un logout forzado en client.js.
 */
export async function getValidAccessToken() {
  // Token válido — lo devolvemos directamente sin llamada de red
  if (!isTokenExpired()) {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available. User must log in again.");
  }

  // El refresco usa grant_type=refresh_token — diferente al intercambio
  // inicial que usa grant_type=authorization_code
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  });

  if (!response.ok) {
    // Si el refresco falla (refresh token revocado, cuenta eliminada...)
    // limpiamos todo y forzamos un nuevo login
    clearTokens();
    throw new Error("Token refresh failed. User must log in again.");
  }

  const data = await response.json();
  saveTokens(data);
  return data.access_token;
}

// ─── Intercambio de código por tokens ─────────────────────────────────────────

/**
 * Intercambia el code de autorización por access_token + refresh_token.
 *
 * Se llama una sola vez desde CallbackPage.jsx cuando Spotify redirige
 * de vuelta con ?code=... tras el login del usuario.
 *
 * El code_verifier que enviamos aquí debe coincidir con el challenge
 * que enviamos al inicio del flujo — Spotify verifica que
 * SHA-256(verifier) == challenge antes de dar los tokens.
 *
 * Tras el intercambio limpiamos el verifier — ya no lo necesitamos
 * y no debe poder reutilizarse.
 */
export async function exchangeCodeForTokens(code) {
  const verifier = getCodeVerifier();
  if (!verifier) throw new Error("No code verifier found in storage.");

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error_description || "Token exchange failed.");
  }

  const data = await response.json();
  saveTokens(data);
  // Limpiamos el verifier — es de un solo uso
  clearCodeVerifier();
  return data;
}
