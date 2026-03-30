import { useState, useEffect } from "react";
import { spotifyFetch } from "../api/client.js";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAllPlaylists() {
      try {
        setLoading(true);
        const all = [];
        let url = "/me/playlists?limit=10";

        // Seguimos pidiendo páginas hasta que no haya más
        while (url) {
          const data = await spotifyFetch(url);
          all.push(...data.items);
          // next contiene la URL completa de la siguiente página
          // o null si no hay más
          if (data.next) {
            // Quitamos el base URL porque spotifyFetch ya lo añade
            url = data.next.replace("https://api.spotify.com/v1", "");
          } else {
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
  }, []);

  return { playlists, loading, error };
}
