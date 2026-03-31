import { useState } from "react";
import { usePlaylists } from "../../hooks/usePlaylists.js";
import { getPlaylistTracks } from "../../api/playlists.js";
import { formatDuration } from "../../utils/formatDuration.js";
import "./PlaylistPanel.scss";

export default function PlaylistPanel({ isPremium }) {
  const { playlists, loading, error } = usePlaylists();
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [filter, setFilter] = useState('');

  const filteredPlaylists = playlists.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  )

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

  if (!isPremium) {
    return (
      <div className="playlist-panel">
        <p className="playlist-panel__locked">
          🔒 Las playlists requieren Spotify Premium
        </p>
      </div>
    );
  }

  if (loading)
    return (
      <div className="playlist-panel">
        <p className="playlist-panel__status">Cargando playlists...</p>
      </div>
    );

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

      {/* Vista de lista de playlists */}
      {!selectedPlaylist && (
        <>
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

      {/* Vista de canciones de una playlist */}
      {selectedPlaylist && (
        <div className="playlist-panel__tracks">
          <button
            className="playlist-panel__back"
            onClick={() => setSelectedPlaylist(null)}
          >
            ← Volver
          </button>

          <h3 className="playlist-panel__title">
            {selectedPlaylist.name} — {tracks.length} canciones
          </h3>

          {loadingTracks && (
            <p className="playlist-panel__status">Cargando canciones...</p>
          )}

          <ul className="playlist-panel__list">
            {tracks.map(({ item }) =>
              item ? (
                <li key={item.id} className="playlist-panel__item">
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
              ) : null
            )}
          </ul>
        </div>
      )}

    </div>
  );
}