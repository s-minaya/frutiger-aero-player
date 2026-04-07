/**
 * Panel de reproducción del WMPlayer
 *
 * Conecta dos piezas:
 * - PlayerContext: sabe QUÉ canción reproducir (currentTrack, queue)
 * - Props de WMPlayer: sabe EN QUÉ dispositivo reproducir (deviceId)
 *
 * Por qué deviceId viene como prop y no de useSpotifyPlayer directamente:
 * useSpotifyPlayer vive en WMPlayer para que el SDK no se desmonte
 * al cambiar de tab. PlayerPanel recibe deviceId como prop para
 * poder usarlo sin reinicializar el SDK.
 *
 * Cuando currentTrack cambia (usuario hace click en una canción desde
 * SearchPanel o PlaylistPanel), el useEffect reproduce la canción en
 * el dispositivo del SDK. La navegación siguiente/anterior se gestiona
 * en PlayerProvider con nextTrack() y previousTrack() que mantienen
 * la queue local sincronizada.
 *
 * Props:
 * - deviceId: ID del dispositivo del SDK — necesario para playTrackOnDevice
 * - playerState: estado de reproducción del SDK (posición, pausa...)
 * - sdkLoading: true mientras el SDK se está inicializando
 * - sdkError: mensaje de error si el SDK falla
 *
 * Estados visuales:
 * - SDK cargando: mensaje de conexión
 * - Error del SDK: mensaje de error
 * - Sin canción seleccionada: mensaje invitando a elegir una
 * - Reproduciendo: portada, título, artista, controles, progreso, volumen
 */

import { useEffect } from "react";
import { usePlayer } from "../../hooks/usePlayer.js";
import {
  playTrackOnDevice,
  pausePlayback,
  resumePlayback,
  setPlayerVolume,
} from "../../api/player.js";
import "./PlayerPanel.scss";

export default function PlayerPanel({
  deviceId,
  playerState,
  sdkLoading,
  sdkError,
}) {
  const {
    currentTrack,
    isPlaying,
    volume,
    setVolume,
    togglePlay,
    nextTrack,
    previousTrack,
  } = usePlayer();

  /**
   * Cuando currentTrack cambia, reproducimos la canción en el SDK.
   *
   * Por qué useEffect y no onClick:
   * playTrack() se puede llamar desde SearchPanel, PlaylistPanel, o
   * en el futuro desde cualquier otro sitio. El efecto reacciona al
   * cambio de currentTrack independientemente de dónde venga.
   *
   * La dependencia [currentTrack, deviceId] asegura que:
   * - Se ejecuta cuando cambia la canción
   * - Espera a tener el deviceId antes de intentar reproducir
   */
  useEffect(() => {
    if (!currentTrack || !deviceId) return;
    playTrackOnDevice(currentTrack.uri, deviceId).catch((err) =>
      console.error("Error al reproducir:", err),
    );
  }, [currentTrack, deviceId]);

  /**
   * Sincronizamos el estado isPlaying del contexto con el SDK.
   * El SDK es la fuente de verdad — cuando playerState cambia
   * (el usuario pausa desde otro dispositivo, por ejemplo)
   * podríamos sincronizar aquí en el futuro.
   */
  async function handleTogglePlay() {
    togglePlay();
    if (isPlaying) {
      await pausePlayback();
    } else {
      await resumePlayback();
    }
  }

  function handleNext() {
    nextTrack();
  }

  function handlePrevious() {
    previousTrack();
  }

  async function handleVolumeChange(e) {
    const newVolume = Number(e.target.value) / 100;
    setVolume(newVolume);
    await setPlayerVolume(newVolume);
  }

  // ── Guards de renderizado ──────────────────────────────────────────

  if (sdkLoading)
    return (
      <div className="player-panel">
        <p className="player-panel__status">Conectando con Spotify...</p>
      </div>
    );

  if (sdkError)
    return (
      <div className="player-panel">
        <p className="player-panel__status player-panel__status--error">
          {sdkError}
        </p>
      </div>
    );

  if (!currentTrack)
    return (
      <div className="player-panel">
        <p className="player-panel__status">
          🎵 Busca una canción o abre una playlist para empezar
        </p>
      </div>
    );

  // Extraemos los datos que necesitamos del track
  const { name, artists, album, duration_ms } = currentTrack;
  const artistName = artists[0].name;
  const coverUrl = album.images[0]?.url;

  // Progreso actual en ms — viene del playerState del SDK
  const position = playerState?.position ?? 0;
  const duration = duration_ms ?? 0;

  return (
    <div className="player-panel">
      {/* ── Info de la canción ────────────────────────────────────── */}
      <div className="player-panel__track-info">
        <img className="player-panel__cover" src={coverUrl} alt={album.name} />
        <div className="player-panel__meta">
          <span className="player-panel__name">{name}</span>
          <span className="player-panel__artist">{artistName}</span>
        </div>
      </div>

      {/* ── Barra de progreso ─────────────────────────────────────── */}
      <div className="player-panel__progress">
        <span className="player-panel__time">{formatMs(position)}</span>
        <div className="player-panel__bar">
          <div
            className="player-panel__bar-fill"
            style={{
              width: `${duration > 0 ? (position / duration) * 100 : 0}%`,
            }}
          />
        </div>
        <span className="player-panel__time">{formatMs(duration)}</span>
      </div>

      {/* ── Controles ────────────────────────────────────────────── */}
      <div className="player-panel__controls">
        <button className="player-panel__btn" onClick={handlePrevious}>
          ⏮
        </button>
        <button
          className="player-panel__btn player-panel__btn--play"
          onClick={handleTogglePlay}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button className="player-panel__btn" onClick={handleNext}>
          ⏭
        </button>
      </div>

      {/* ── Volumen ───────────────────────────────────────────────── */}
      <div className="player-panel__volume">
        <span className="player-panel__volume-icon">🔈</span>
        <input
          className="player-panel__volume-slider"
          type="range"
          min="0"
          max="100"
          value={Math.round(volume * 100)}
          onChange={handleVolumeChange}
        />
        <span className="player-panel__volume-label">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}

/**
 * Convierte milisegundos a formato mm:ss para mostrar el progreso.
 * Similar a formatDuration de utils/ pero local a este componente
 * porque solo lo usa PlayerPanel.
 */
function formatMs(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
