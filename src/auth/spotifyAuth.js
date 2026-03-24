// Construye la URL de autorización y lanza el flujo PKCE

import { generateCodeVerifier, generateCodeChallenge } from "./pkce.js";
import { saveCodeVerifier, clearTokens } from "./tokenManager.js";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";

// Scopes mínimos para la Fase 1:
// - user-read-private: acceder al perfil y detectar si tiene Premium
// - user-read-email: mostrar el email en el perfil (opcional pero útil)
// En fases posteriores añadiremos: streaming, playlist-read-private, etc.
const SCOPES = ["user-read-private", "user-read-email"];

/**
 * Inicia el flujo de login con Spotify.
 * Genera el PKCE, guarda el verifier y redirige al usuario.
 */
export async function loginWithSpotify() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  saveCodeVerifier(verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SCOPES.join(" "),
  });

  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Cierra la sesión del usuario: elimina los tokens locales.
 * Nota: esto no revoca el token en Spotify, solo limpia el estado local.
 */
export function logout() {
  clearTokens();
  // Redirige a la raíz de la app para mostrar la pantalla de login
  window.location.href = import.meta.env.BASE_URL || "/";
}
