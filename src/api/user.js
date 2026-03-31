/**
 * user.js — Llamadas a la API relacionadas con el perfil del usuario
 *
 * Actualmente solo necesitamos dos cosas del perfil:
 * - Los datos básicos (nombre, avatar) para mostrarlos en el StartMenu
 * - Si el usuario tiene Premium para activar playlists y letras
 *
 * El campo `product` de la respuesta de /me determina qué funciones
 * están disponibles:
 *
 * | Funcionalidad        | free | premium |
 * |----------------------|------|---------|
 * | Buscar canciones     | ✅   | ✅     |
 * | Play/pause/siguiente | ✅   | ✅     |
 * | Control de volumen   | ✅   | ✅     |
 * | Playlists            | ❌   | ✅     |
 * | Letras               | ❌   | ✅     |
 */

import { spotifyFetch } from "./client.js";

/**
 * Obtiene el perfil completo del usuario autenticado.
 * Ref: GET /me
 *
 * Campos relevantes de la respuesta:
 * - display_name: nombre a mostrar en el StartMenu
 * - images: array de avatares — usamos images[0].url
 * - product: 'premium' | 'free' | 'open'
 * - email: email de la cuenta (lo pedimos en los scopes pero no lo mostramos)
 *
 * Requiere el scope user-read-private para acceder al campo product.
 * Sin ese scope product vendría como undefined y isPremium sería false.
 */
export async function getCurrentUser() {
  return spotifyFetch("/me");
}

/**
 * Comprueba si el usuario tiene cuenta Premium.
 *
 * Hace una llamada a /me y comprueba el campo product.
 * No se usa directamente en la app — useAuth.js llama a getCurrentUser()
 * y deriva isPremium del campo product en el mismo objeto.
 * Se mantiene como utilidad por si hace falta en algún punto futuro.
 */
export async function checkIsPremium() {
  const user = await getCurrentUser();
  return user?.product === "premium";
}
