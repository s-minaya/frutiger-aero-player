/**
 * useSearch.js — Estado y lógica de la búsqueda de canciones
 *
 * Gestiona el ciclo completo de una búsqueda:
 * 1. El usuario escribe en el input → setQuery actualiza el estado
 * 2. useEffect detecta el cambio de query y programa una búsqueda
 * 3. Si el usuario sigue escribiendo antes de 400ms, cancela y reprograma
 * 4. Tras 400ms sin escribir, llama a searchTracks
 * 5. Actualiza results, loading y error según el resultado
 *
 * El debounce es crítico para no saturar la API — sin él haríamos
 * una llamada por cada letra que escribe el usuario.
 */

import { useState, useEffect } from "react";
import { searchTracks } from "../api/search.js";

export function useSearch() {
  // Texto del input — controlado por el componente via setQuery
  const [query, setQuery] = useState("");

  // Array de tracks devueltos por la API — vacío hasta que hay resultados
  const [results, setResults] = useState([]);

  // true durante los 400ms de debounce Y mientras se hace la llamada a la API
  const [loading, setLoading] = useState(false);

  // Mensaje de error si searchTracks lanza una excepción
  const [error, setError] = useState(null);

  /**
   * Efecto de debounce — se ejecuta cada vez que query cambia.
   *
   * Patrón de debounce con setTimeout/clearTimeout:
   * - Cada vez que query cambia, creamos un timer de 400ms
   * - La función de cleanup (return) cancela el timer anterior
   * - Si query vuelve a cambiar antes de 400ms, el cleanup cancela
   *   el timer pendiente y se crea uno nuevo
   * - Solo cuando pasan 400ms sin cambios se ejecuta la búsqueda
   *
   * Ejemplo con el usuario escribiendo "radio":
   * - Escribe 'r' → timer 1 (400ms)
   * - Escribe 'a' → cancela timer 1, timer 2 (400ms)
   * - Escribe 'd' → cancela timer 2, timer 3 (400ms)
   * - ... 400ms sin escribir → busca "radio"
   */
  useEffect(() => {
    // Query vacía — limpiamos resultados y no buscamos
    // Esto ocurre cuando el usuario borra el input
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null); // limpiamos el error anterior antes de cada búsqueda
        const tracks = await searchTracks(query);
        setResults(tracks);
      } catch (err) {
        setError(err.message);
        // No limpiamos results aquí — si falla una búsqueda mantenemos
        // los resultados anteriores en pantalla
      } finally {
        setLoading(false);
      }
    }, 400);

    // Cleanup: cancela el timer si query cambia antes de 400ms
    // React ejecuta esta función antes de cada re-ejecución del efecto
    return () => clearTimeout(debounceTimer);
  }, [query]); // solo se re-ejecuta cuando query cambia

  return {
    query, // valor actual del input
    setQuery, // función para actualizar el input desde SearchPanel
    results, // array de tracks — vacío, cargando o con resultados
    loading, // true mientras espera el debounce o la respuesta de la API
    error, // mensaje de error o null
  };
}
