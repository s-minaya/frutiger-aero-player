/**
 * useAuth.js — Hook central de autenticación
 *
 * Expone el estado de la sesión a toda la app: quién es el usuario,
 * si tiene Premium, si está cargando, y las acciones de login/logout.
 *
 * Por qué es un hook y no un Context:
 * Solo lo usan AppContent (para el loading global) y Desktop (para
 * pasar user e isPremium a los componentes hijos). Con props es
 * suficiente por ahora — si la prop drilling se vuelve problemática
 * en fases futuras se puede migrar a Context o Zustand.
 *
 * Por qué vive en AppContent y no en App:
 * useAuth llama a getCurrentUser() que usa spotifyFetch(), que podría
 * necesitar useNavigate en el futuro. useNavigate requiere estar dentro
 * de un BrowserRouter. App monta el BrowserRouter, así que useAuth
 * debe estar en un componente hijo (AppContent).
 */

import { useState, useEffect, useCallback } from "react";
import { isLoggedIn } from "../auth/tokenManager.js";
import { getCurrentUser } from "../api/user.js";
import { logout } from "../auth/spotifyAuth.js";

export function useAuth() {
  // Perfil completo del usuario — null si no hay sesión o mientras carga
  const [user, setUser] = useState(null);

  // Derivado de user.product === 'premium' — controla qué funciones
  // están disponibles (playlists y letras solo para Premium)
  const [isPremium, setIsPremium] = useState(false);

  // true mientras se carga el perfil — AppContent muestra BootScreen
  // y Desktop no se renderiza hasta que loading es false
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  /**
   * Carga el perfil del usuario desde la API.
   *
   * useCallback con [] evita que la función se recree en cada render,
   * lo que a su vez evita que el useEffect de abajo se ejecute en bucle.
   *
   * Se llama:
   * 1. Al montar el componente (useEffect de abajo)
   * 2. Manualmente tras el login con Spotify (reload) para actualizar
   *    el estado sin recargar la página — LoginScreen llama a reload()
   *    cuando el popup envía 'spotify-login-success'
   */
  const loadUser = useCallback(async () => {
    // Si no hay tokens en localStorage no tiene sentido llamar a la API
    // isLoggedIn() es síncrono — no hace llamadas de red
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profile = await getCurrentUser();
      setUser(profile);
      // Derivamos isPremium aquí para no tener que calcularlo
      // en cada componente que lo necesite
      setIsPremium(profile?.product === "premium");
    } catch (err) {
      setError(err.message);
    } finally {
      // loading siempre vuelve a false — tanto si hay éxito como si hay error
      setLoading(false);
    }
  }, []);

  // Cargamos el perfil al montar — una sola vez gracias a useCallback
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user, // perfil completo del usuario o null
    isPremium, // boolean — controla acceso a playlists y letras
    isLoggedIn: !!user, // true si hay usuario cargado
    loading, // true mientras carga — usar para mostrar BootScreen
    error, // mensaje de error si getCurrentUser() falla
    logout, // limpia tokens y recarga — viene de spotifyAuth.js
    reload: loadUser, // recarga el perfil sin recargar la página
  };
}
