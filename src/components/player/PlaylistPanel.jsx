/**
 * PlaylistPanel.jsx — Panel de playlists del usuario
 *
 * Solo disponible para usuarios Premium.
 *
 * Tiene dos vistas que se alternan:
 * 1. Lista de playlists — con filtro por nombre
 * 2. Canciones de una playlist — al hacer click en una playlist
 *
 * Estados y flujo:
 * - isPremium=false → mensaje de bloqueo (sin llamadas a la API)
 * - isPremium=true → usePlaylists carga todas las playlists paginando
 * - Click en playlist → getPlaylistTracks carga sus canciones
 * - Click en "← Volver" → vuelve a la lista de playlists
 *
 * Nota sobre la estructura de la respuesta de /playlists/{id}/items:
 * La API devuelve { item: {...} } (no "track") desde un cambio reciente.
 * Algunos items pueden ser null (episodios de podcast) — los filtramos.
 */

import { useState } from "react";
import { usePlaylists } from "../../hooks/usePlaylists.js";
import { getPlaylistTracks } from "../../api/playlists.js";
import { formatDuration } from "../../utils/formatDuration.js";
import "./PlaylistPanel.scss";

export default function PlaylistPanel({ isPremium }) {
  const { playlists, loading, error } = usePlaylists();

  // Playlist seleccionada — null cuando estamos en la vista de lista
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  // Canciones de la playlist seleccionada
  const [tracks, setTracks] = useState([]);

  // true mientras se cargan las canciones de una playlist
  const [loadingTracks, setLoadingTracks] = useState(false);

  // Texto del filtro — se aplica localmente sin llamadas a la API
  const [filter, setFilter] = useState("");

  /**
   * Filtra las playlists por nombre.
   * El filtro es case-insensitive y se aplica sobre el array ya cargado
   * en memoria — no hace llamadas a la API.
   */
  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase()),
  );

  /**
   * Carga las canciones de una playlist al hacer click en ella.
   * Guarda la playlist seleccionada para mostrar su nombre en el título
   * y cambiar a la vista de canciones.
   */
  async function handleSelectPlaylist(playlist) {
    setSelectedPlaylist(playlist);
    setLoadingTracks(true);
    try {
      const items = await getPlaylistTracks(playlist.id);
      setTracks(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTracks(false);
    }
  }

  // ── Guards de renderizado ──────────────────────────────────────────────────

  // Sin Premium no mostramos nada ni hacemos llamadas a la API
  if (!isPremium) {
    return (
      <div className="playlist-panel">
        <p className="playlist-panel__locked">
          🔒 Las playlists requieren Spotify Premium
        </p>
      </div>
    );
  }

  // Cargando las playlists — usePlaylists pagina hasta tenerlas todas
  if (loading)
    return (
      <div className="playlist-panel">
        <p className="playlist-panel__status">Cargando playlists...</p>
      </div>
    );

  // Error al cargar las playlists
  if (error)
    return (
      <div className="playlist-panel">
        <p className="playlist-panel__status playlist-panel__status--error">
          {error}
        </p>
      </div>
    );

  return (
    <div className="playlist-panel">
      {/* ── Vista de lista de playlists ───────────────────────────────── */}
      {/* Se muestra cuando no hay playlist seleccionada */}
      {!selectedPlaylist && (
        <>
          {/* Filtro local — no hace llamadas a la API,
              filtra el array playlists ya cargado en memoria */}
          <div className="playlist-panel__search">
            <input
              className="playlist-panel__filter"
              type="text"
              placeholder="Filtrar playlists..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <ul className="playlist-panel__list">
            {filteredPlaylists.map((playlist) => (
              <li
                key={playlist.id}
                className="playlist-panel__item"
                onClick={() => handleSelectPlaylist(playlist)}
              >
                {/* Optional chaining en images — algunas playlists
                    no tienen portada y devuelven images=[] */}
                <img
                  className="playlist-panel__cover"
                  src={playlist.images?.[0]?.url}
                  alt={playlist.name}
                />
                <div className="playlist-panel__info">
                  <span className="playlist-panel__name">{playlist.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ── Vista de canciones de una playlist ───────────────────────── */}
      {/* Se muestra cuando hay una playlist seleccionada */}
      {selectedPlaylist && (
        <div className="playlist-panel__tracks">
          {/* Volver resetea selectedPlaylist → vuelve a la lista */}
          <button
            className="playlist-panel__back"
            onClick={() => setSelectedPlaylist(null)}
          >
            ← Volver
          </button>

          {/* tracks.length es el contador real — más fiable que
              playlist.tracks.total que no es fiable en Development Mode */}
          <h3 className="playlist-panel__title">
            {selectedPlaylist.name} — {tracks.length} canciones
          </h3>

          {loadingTracks && (
            <p className="playlist-panel__status">Cargando canciones...</p>
          )}

          <ul className="playlist-panel__list">
            {tracks.map(({ item }) =>
              // item puede ser null si es un episodio de podcast —
              // la API de Spotify mezcla tracks y episodios en la misma respuesta
              item ? (
                <li key={item.id} className="playlist-panel__item">
                  {/* images[2] = miniatura 64px — igual que en SearchPanel */}
                  <img
                    className="playlist-panel__cover"
                    src={item.album.images?.[2]?.url}
                    alt={item.album.name}
                  />
                  <div className="playlist-panel__info">
                    <span className="playlist-panel__name">{item.name}</span>
                    <span className="playlist-panel__count">
                      {item.artists[0].name}
                    </span>
                  </div>
                  <span className="playlist-panel__duration">
                    {formatDuration(item.duration_ms)}
                  </span>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
