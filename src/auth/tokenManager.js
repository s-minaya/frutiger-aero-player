// Gestión segura de tokens en localStorage
// El Client Secret NUNCA toca este archivo (PKCE no lo necesita)

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

export function saveTokens({ access_token, refresh_token, expires_in }) {
  const expiresAt = Date.now() + expires_in * 1000;
  localStorage.setItem(KEYS.ACCESS_TOKEN, access_token);
  localStorage.setItem(KEYS.EXPIRES_AT, String(expiresAt));
  // El refresh_token solo se sobreescribe si viene uno nuevo
  if (refresh_token) {
    localStorage.setItem(KEYS.REFRESH_TOKEN, refresh_token);
  }
}

export function clearTokens() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

export function getRefreshToken() {
  return localStorage.getItem(KEYS.REFRESH_TOKEN);
}

export function saveCodeVerifier(verifier) {
  localStorage.setItem(KEYS.CODE_VERIFIER, verifier);
}

export function getCodeVerifier() {
  return localStorage.getItem(KEYS.CODE_VERIFIER);
}

export function clearCodeVerifier() {
  localStorage.removeItem(KEYS.CODE_VERIFIER);
}

// ─── Estado del token ──────────────────────────────────────────────────────────

export function isTokenExpired() {
  const expiresAt = Number(localStorage.getItem(KEYS.EXPIRES_AT));
  if (!expiresAt) return true;
  // Considera expirado 60 segundos antes para evitar llamadas con token caducado
  return Date.now() > expiresAt - 60_000;
}

export function isLoggedIn() {
  return (
    !!localStorage.getItem(KEYS.ACCESS_TOKEN) &&
    !!localStorage.getItem(KEYS.REFRESH_TOKEN)
  );
}

// ─── Refresco automático ───────────────────────────────────────────────────────

/**
 * Devuelve un access token válido.
 * Si ha expirado, lo refresca silenciosamente antes de devolverlo.
 */
export async function getValidAccessToken() {
  if (!isTokenExpired()) {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available. User must log in again.");
  }

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
    clearTokens();
    throw new Error("Token refresh failed. User must log in again.");
  }

  const data = await response.json();
  saveTokens(data);
  return data.access_token;
}

// ─── Intercambio de código por tokens (callback) ───────────────────────────────

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
  clearCodeVerifier();
  return data;
}
