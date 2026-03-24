// Llamadas relacionadas con el perfil del usuario

import { spotifyFetch } from "./client.js";

/**
 * Obtiene el perfil del usuario actual.
 * Ref: GET /me
 *
 * El campo `product` devuelve 'premium', 'free' o 'open'.
 * Lo usamos para activar/desactivar funciones de reproducción.
 */
export async function getCurrentUser() {
  return spotifyFetch("/me");
}

/**
 * Devuelve true si el usuario tiene cuenta Premium.
 */
export async function checkIsPremium() {
  const user = await getCurrentUser();
  return user?.product === "premium";
}
