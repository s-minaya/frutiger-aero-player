/**
 * spotifyAuth.js — Inicio y cierre del flujo de autenticación con Spotify
 *
 * Este archivo orquesta el flujo OAuth 2.0 con PKCE:
 * - Construye la URL de autorización con todos los parámetros necesarios
 * - Abre el popup de login centrado en pantalla
 * - Escucha el mensaje del popup cuando el login termina
 * - Gestiona el logout limpiando los tokens
 *
 * Por qué usamos popup en vez de redirigir la pestaña principal:
 * Si redirigiéramos la pestaña principal, el usuario perdería el estado
 * del escritorio (menús abiertos, posición del WMP, etc.) y al volver
 * todo se recargaría desde cero. El popup mantiene la app intacta.
 *
 * Comunicación popup → ventana padre:
 * Cuando CallbackPage.jsx termina el intercambio de tokens, envía
 * el mensaje 'spotify-login-success' con postMessage. Este archivo
 * lo escucha y llama a onSuccess() para actualizar el estado de la app.
 */

import { generateCodeVerifier, generateCodeChallenge } from "./pkce.js";
import { saveCodeVerifier, clearTokens } from "./tokenManager.js";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";

/**
 * Scopes que pedimos a Spotify — solo los mínimos necesarios.
 *
 * Pedir más scopes de los necesarios viola los ToS de Spotify
 * y genera desconfianza en el usuario cuando ve la pantalla de permisos.
 *
 * - user-read-private: acceder al perfil y detectar si tiene Premium
 *   (campo product: 'premium' | 'free')
 * - user-read-email: mostrar el email en el perfil
 * - playlist-read-private: leer las playlists privadas del usuario
 * - streaming: permite usar el SDK como dispositivo de reproducción
 * - user-read-playback-state: leer el estado actual del player
 * - user-modify-playback-state: controlar play/pause/siguiente/anterior
 */
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
];

/**
 * Construye la URL completa de autorización de Spotify.
 *
 * Genera el par verifier/challenge PKCE, guarda el verifier en
 * localStorage para recuperarlo en el callback, y construye la URL
 * con todos los parámetros que Spotify necesita.
 *
 * Es async porque generateCodeChallenge usa crypto.subtle (async).
 * Es privada — solo la usan loginWithSpotify y loginWithSpotifyPopup.
 */
async function buildAuthUrl() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // Guardamos el verifier ANTES de redirigir — si lo guardáramos después
  // la redirección interrumpiría la ejecución y nunca se guardaría
  saveCodeVerifier(verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code", // solicitamos un código de autorización
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256", // SHA-256 — el único método seguro aceptado
    code_challenge: challenge,
    scope: SCOPES.join(" "), // Spotify espera los scopes separados por espacio
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Login redirigiendo la pestaña actual a Spotify.
 *
 * No se usa actualmente — preferimos el popup para no perder
 * el estado del escritorio. Se mantiene por si acaso.
 */
export async function loginWithSpotify() {
  const url = await buildAuthUrl();
  window.location.href = url;
}

/**
 * Login abriendo un popup centrado en pantalla.
 *
 * Flujo:
 * 1. Construye la URL de autorización con PKCE
 * 2. Abre un popup centrado apuntando a esa URL
 * 3. El usuario se autentica en Spotify dentro del popup
 * 4. CallbackPage.jsx intercambia el code por tokens
 * 5. CallbackPage.jsx envía 'spotify-login-success' con postMessage
 * 6. Este handler lo recibe, limpia el listener y llama a onSuccess()
 *
 * La verificación del origin en el handler es importante por seguridad —
 * descarta mensajes que vengan de otros dominios (posibles ataques XSS).
 *
 * @param {Function} onSuccess — se ejecuta cuando el login termina con éxito
 */
export async function loginWithSpotifyPopup(onSuccess) {
  const url = await buildAuthUrl();

  // Calculamos la posición para centrar el popup en la pantalla
  const width = 500;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  window.open(
    url,
    "spotify-login", // nombre de la ventana — evita abrir múltiples popups
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  // Escuchamos el mensaje que CallbackPage.jsx enviará cuando termine
  function handler(e) {
    // Ignoramos mensajes de otros orígenes — seguridad básica
    if (e.origin !== window.location.origin) return;
    if (e.data === "spotify-login-success") {
      // Limpiamos el listener para no acumular handlers en memoria
      window.removeEventListener("message", handler);
      onSuccess();
    }
  }

  window.addEventListener("message", handler);
}

/**
 * Cierra la sesión del usuario.
 *
 * Limpia todos los tokens del localStorage y recarga la página.
 * Al recargar, isLoggedIn() devuelve false y AppContent redirige a /login.
 *
 * Nota: esto no revoca el token en Spotify — el usuario seguirá
 * apareciendo como autorizado en su cuenta de Spotify, pero nuestra
 * app ya no tiene tokens para hacer llamadas en su nombre.
 */
export function logout() {
  clearTokens();
  window.location.reload();
}
