// src/auth/pkce.js
// Implementación del flujo Authorization Code with PKCE
// Ref: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

/**
 * Genera un code_verifier aleatorio (entre 43 y 128 caracteres, base64url)
 */
export function generateCodeVerifier() {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Genera el code_challenge a partir del verifier (SHA-256 + base64url)
 */
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Codifica un Uint8Array en base64url (sin padding, sin +, sin /)
 */
function base64UrlEncode(array) {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
