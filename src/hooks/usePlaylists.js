/**
 * usePlaylists.js — Carga todas las playlists del usuario con paginación
 *
 * La API de Spotify devuelve las playlists en páginas de máximo 10
 * (límite de Development Mode). Este hook las carga todas
 * automáticamente paginando hasta que no haya más.
 *
 * Por qué paginamos aquí y no en el componente:
 * El componente no debería saber cómo funciona la paginación de la API.
 * Solo necesita recibir el array completo de playlists. La lógica
 * de red y paginación pertenece al hook.
 *
 * Solo se ejecuta una vez al montar — las playlists no cambian
 * durante el uso normal de la app.
 */

import { useState, useEffect } from "react";
import { spotifyFetch } from "../api/client.js";

export function usePlaylists() {
  // Array acumulado de todas las playlists del usuario
  const [playlists, setPlaylists] = useState([]);

  // true mientras se cargan las páginas — PlaylistPanel muestra
  // "Cargando playlists..." hasta que loading es false
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAllPlaylists() {
      try {
        setLoading(true);
        const all = [];

        // Empezamos con la primera página
        // limit=10 es el máximo en Development Mode
        let url = "/me/playlists?limit=10";

        /**
         * Bucle de paginación:
         * Spotify devuelve un campo "next" con la URL completa de la
         * siguiente página, o null si estamos en la última.
         *
         * Ejemplo de respuesta:
         * {
         *   items: [...10 playlists...],
         *   next: "https://api.spotify.com/v1/me/playlists?offset=10&limit=10",
         *   total: 47
         * }
         *
         * Iteramos hasta que next es null, acumulando todas las playlists
         * en el array "all".
         */
        while (url) {
          const data = await spotifyFetch(url);
          all.push(...data.items);

          if (data.next) {
            // data.next es una URL absoluta pero spotifyFetch espera
            // una ruta relativa — quitamos el base URL
            url = data.next.replace("https://api.spotify.com/v1", "");
          } else {
            // No hay más páginas — salimos del bucle
            url = null;
          }
        }

        setPlaylists(all);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAllPlaylists();
  }, []); // sin dependencias — solo se ejecuta al montar el componente

  return {
    playlists, // array completo de todas las playlists del usuario
    loading, // true mientras se cargan las páginas
    error, // mensaje de error o null
  };
}
