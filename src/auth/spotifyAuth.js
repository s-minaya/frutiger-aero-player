import { generateCodeVerifier, generateCodeChallenge } from "./pkce.js";
import { saveCodeVerifier, clearTokens } from "./tokenManager.js";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";

const SCOPES = ["user-read-private", "user-read-email"];

// Construye la URL de autorización
async function buildAuthUrl() {
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

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

// Login en la misma pestaña (por si acaso)
export async function loginWithSpotify() {
  const url = await buildAuthUrl();
  window.location.href = url;
}

// Login en popup
export async function loginWithSpotifyPopup(onSuccess) {
  const url = await buildAuthUrl();

  const width = 500;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  window.open(
    url,
    "spotify-login",
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  // Escucha el mensaje del popup cuando termine el login
  function handler(e) {
    if (e.origin !== window.location.origin) return;
    if (e.data === "spotify-login-success") {
      window.removeEventListener("message", handler);
      onSuccess();
    }
  }

  window.addEventListener("message", handler);
}

export function logout() {
  clearTokens();
  window.location.reload();
}
