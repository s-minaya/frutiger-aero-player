import { useSearch } from '../../hooks/useSearch.js'
import { formatDuration } from '../../utils/formatDuration.js'
import './SearchPanel.scss'

export default function SearchPanel() {
  const { query, setQuery, results, loading, error } = useSearch()

  return (
    <div className="search-panel">

      {/* Input de búsqueda */}
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
      {loading && <p className="search-panel__status">Buscando...</p>}
      {error && <p className="search-panel__status search-panel__status--error">{error}</p>}
      {!loading && query && results.length === 0 && (
        <p className="search-panel__status">No se encontraron resultados</p>
      )}

      {/* Resultados */}
      <ul className="search-panel__results">
        {results.map((track) => (
          <li key={track.id} className="search-panel__track">
            <img
              className="search-panel__cover"
              src={track.album.images[2]?.url}
              alt={track.album.name}
            />
            <div className="search-panel__info">
              <span className="search-panel__name">{track.name}</span>
              <span className="search-panel__artist">{track.artists[0].name}</span>
            </div>
            <span className="search-panel__duration">
              {formatDuration(track.duration_ms)}
            </span>
          </li>
        ))}
      </ul>

    </div>
  )
}