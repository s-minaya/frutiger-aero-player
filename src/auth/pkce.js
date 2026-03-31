/**
 * pkce.js — Criptografía para el flujo OAuth 2.0 con PKCE
 *
 * PKCE (Proof Key for Code Exchange) es una extensión de OAuth 2.0
 * diseñada para apps sin backend que no pueden guardar un Client Secret.
 *
 * El problema que resuelve: si alguien intercepta el "code" que Spotify
 * devuelve tras el login, no puede canjearlo por tokens porque no tiene
 * el "verifier" que solo nuestra app conoce.
 *
 * Flujo completo:
 * 1. Generamos un verifier aleatorio
 * 2. Calculamos challenge = SHA-256(verifier)
 * 3. Enviamos el challenge a Spotify al iniciar el login (spotifyAuth.js)
 * 4. Spotify devuelve un code
 * 5. Canjeamos code + verifier por tokens (tokenManager.js)
 * 6. Spotify verifica que SHA-256(verifier) == challenge guardado
 *
 * Ref: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 * RFC: https://datatracker.ietf.org/doc/html/rfc7636
 */

/**
 * Genera un code_verifier aleatorio.
 *
 * El verifier es un secreto de un solo uso que solo conoce nuestra app.
 * Se guarda en localStorage al inicio del login y se envía a Spotify
 * al final para demostrar que somos nosotros quien inició el flujo.
 *
 * Longitud: 64 bytes → ~86 caracteres en base64url.
 * El estándar RFC 7636 exige entre 43 y 128 caracteres.
 */
export function generateCodeVerifier() {
  // Uint8Array de 64 bytes — el tamaño óptimo según la especificación
  const array = new Uint8Array(64);
  // crypto.getRandomValues es la API del navegador para números aleatorios
  // criptográficamente seguros — no usar Math.random() para esto
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Genera el code_challenge a partir del verifier.
 *
 * El challenge es el hash SHA-256 del verifier codificado en base64url.
 * Se envía públicamente a Spotify al iniciar el login — es seguro porque
 * SHA-256 es una función de un solo sentido: dado el challenge es
 * computacionalmente imposible reconstruir el verifier original.
 *
 * Es async porque crypto.subtle.digest devuelve una Promise.
 */
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  // Convertimos el verifier de string a bytes para poder hashearlo
  const data = encoder.encode(verifier);
  // SHA-256 produce 32 bytes (256 bits) — la Web Crypto API nativa del navegador
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Codifica un Uint8Array en base64url.
 *
 * Base64 estándar usa +, / y = que son problemáticos en URLs y query strings.
 * Base64url los reemplaza para que el resultado pueda ir directamente
 * en una URL sin necesidad de encodeURIComponent:
 *   +  →  -
 *   /  →  _
 *   =  →  (eliminado — el padding no es necesario aquí)
 *
 * Esta función es privada (no se exporta) — solo la usan las dos funciones
 * de este archivo.
 */
function base64UrlEncode(array) {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
