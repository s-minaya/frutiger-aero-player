import { useState, useEffect } from "react";
import { searchTracks } from "../api/search.js";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si no hay texto, limpiamos resultados y salimos
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Esperamos 400ms desde la última tecla antes de buscar
    const debounceTimer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const tracks = await searchTracks(query);
        setResults(tracks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 400);

    // Si el usuario sigue escribiendo, cancelamos el timer anterior
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return { query, setQuery, results, loading, error };
}
