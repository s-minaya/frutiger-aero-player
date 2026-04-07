import { useSearch } from "../../hooks/useSearch.js";
import { formatDuration } from "../../utils/formatDuration.js";
import { usePlayer } from "../../hooks/usePlayer.js";
import "./SearchPanel.scss";

export default function SearchPanel() {
  const { query, setQuery, results, loading, error } = useSearch();
  const { playTrack } = usePlayer();

  return (
    <div className="search-panel">
      {/* Input de búsqueda */}
      {/* Input controlado — query es el estado en useSearch,
          setQuery lo actualiza y dispara el debounce */}
      <div className="search-panel__input-wrapper">
        <input
          className="search-panel__input"
          type="text"
          placeholder="Buscar canciones..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Estados */}
      {/* Cargando — true durante el debounce Y mientras se espera la API */}
      {loading && <p className="search-panel__status">Buscando...</p>}

      {/* Error — mensaje devuelto por SpotifyApiError en client.js */}
      {error && (
        <p className="search-panel__status search-panel__status--error">
          {error}
        </p>
      )}

      {!loading && query && results.length === 0 && (
        <p className="search-panel__status">No se encontraron resultados</p>
      )}

      {/* Resultados */}
      <ul className="search-panel__results">
        {results.map((track) => (
          <li key={track.id} className="search-panel__track" onClick={() => playTrack(track)}>
            {/* Miniatura del álbum — images[2] es el tamaño más pequeño (64px).
                Spotify devuelve tres tamaños: [0]=640px, [1]=300px, [2]=64px.
                Usamos el más pequeño para no cargar imágenes innecesariamente.
                Optional chaining (?.) por si algún track no tiene imágenes */}
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
