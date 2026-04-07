/**
 * Panel de búsqueda de canciones
 *
 * Renderiza el input de búsqueda y los resultados dentro del tab "Buscar"
 * del WMPlayer. Disponible para todos los usuarios independientemente
 * de si tienen Premium o no.
 *
 * Este componente es deliberadamente simple — solo renderiza.
 * Toda la lógica (debounce, llamada a la API, estados) vive en useSearch.
 *
 * Al hacer click en una canción llama a playTrack(track, results) del
 * PlayerContext pasando también la lista completa de resultados como queue.
 * Esto permite a PlayerPanel navegar con siguiente/anterior respetando
 * el orden de los resultados de búsqueda.
 *
 * Estados visuales:
 * - Sin query: solo el input, sin mensajes
 * - Buscando: mensaje de carga mientras espera el debounce + API
 * - Sin resultados: mensaje cuando la API devuelve array vacío
 * - Error: mensaje de error si la API falla (ej: 429, 500)
 * - Con resultados: lista de canciones con portada, título, artista y duración
 */

import { useSearch } from "../../hooks/useSearch.js";
import { formatDuration } from "../../utils/formatDuration.js";
import { usePlayer } from "../../hooks/usePlayer.js";
import "./SearchPanel.scss";

export default function SearchPanel() {
  const { query, setQuery, results, loading, error } = useSearch();
  const { playTrack } = usePlayer();

  return (
    <div className="search-panel">
      {/* ── Input de búsqueda ─────────────────────────────────────────── */}
      {/* Input controlado — query es el estado en useSearch,
          setQuery lo actualiza y dispara el debounce de 400ms */}
      <div className="search-panel__input-wrapper">
        <input
          className="search-panel__input"
          type="text"
          placeholder="Buscar canciones..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* ── Estados de la búsqueda ────────────────────────────────────── */}

      {/* Cargando — true durante el debounce Y mientras se espera la API */}
      {loading && <p className="search-panel__status">Buscando...</p>}

      {/* Error — mensaje devuelto por SpotifyApiError en client.js */}
      {error && (
        <p className="search-panel__status search-panel__status--error">
          {error}
        </p>
      )}

      {/* Sin resultados — solo cuando hay query, no está cargando y el
          array está vacío. Sin la condición query mostraría este mensaje
          al cargar el panel por primera vez antes de escribir nada */}
      {!loading && query && results.length === 0 && (
        <p className="search-panel__status">No se encontraron resultados</p>
      )}

      {/* ── Lista de resultados ───────────────────────────────────────── */}
      <ul className="search-panel__results">
        {results.map((track) => (
          // Pasamos results completo como queue para que PlayerPanel
          // pueda navegar con siguiente/anterior en el orden correcto
          <li
            key={track.id}
            className="search-panel__track"
            onClick={() => playTrack(track, results)}
          >
            {/* images[2] = miniatura 64px — Spotify devuelve tres tamaños:
                [0]=640px, [1]=300px, [2]=64px. Usamos el más pequeño
                para no cargar imágenes innecesariamente */}
            <img
              className="search-panel__cover"
              src={track.album.images[2]?.url}
              alt={track.album.name}
            />
            <div className="search-panel__info">
              <span className="search-panel__name">{track.name}</span>
              <span className="search-panel__artist">
                {track.artists[0].name}
              </span>
            </div>
            {/* Duración convertida de ms a mm:ss con formatDuration */}
            <span className="search-panel__duration">
              {formatDuration(track.duration_ms)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
