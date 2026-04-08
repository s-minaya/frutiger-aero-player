/**
 * PlayerPanel.jsx — Panel de reproducción del WMPlayer
 *
 * Conecta dos piezas:
 * - PlayerContext: sabe QUÉ canción reproducir (currentTrack, queue)
 * - Props de WMPlayer: sabe EN QUÉ dispositivo reproducir (deviceId, player)
 *
 * Por qué deviceId y player vienen como props y no de useSpotifyPlayer:
 * useSpotifyPlayer vive en WMPlayer para que el SDK no se desmonte
 * al cambiar de tab. PlayerPanel recibe estos valores como props para
 * poder usarlos sin reinicializar el SDK.
 *
 * Progreso de la canción:
 * El SDK solo actualiza playerState en eventos puntuales (play, pause...).
 * Para tener un progreso fluido usamos un estado local `position` que
 * avanza cada segundo con un intervalo. playerState.position se usa
 * como fuente de verdad cuando está disponible (displayPosition).
 *
 * Props:
 * - player: objeto Player del SDK — necesario para seek (arrastrar barra)
 * - deviceId: ID del dispositivo — necesario para playTrackOnDevice
 * - playerState: estado del SDK (posición, pausa...)
 * - sdkLoading: true mientras el SDK se está inicializando
 * - sdkError: mensaje de error si el SDK falla
 */

import { useEffect, useState } from "react";
import { usePlayer } from "../../hooks/usePlayer.js";
import {
  playTrackOnDevice,
  pausePlayback,
  resumePlayback,
  setPlayerVolume,
} from "../../api/player.js";
import { formatDuration } from "../../utils/formatDuration.js";
import "./PlayerPanel.scss";

export default function PlayerPanel({
  player,
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

  // Progreso local en ms — avanza cada segundo con el intervalo de abajo.
  // No usamos playerState.position directamente porque solo se actualiza
  // en eventos puntuales y la barra quedaría congelada entre eventos.
  const [position, setPosition] = useState(0);

  // Duración total de la canción en ms
  const duration = currentTrack?.duration_ms ?? 0;

  // Sincronizamos position con playerState cuando este cambia (play, pause, seek)
  const displayPosition = position;

  /**
   * Sincroniza el estado local con el SDK cuando playerState cambia.
   * Ocurre en eventos puntuales: nueva canción, play, pause, seek...
   * Entre eventos el intervalo mantiene el progreso fluido.
   */
  useEffect(() => {
    if (playerState?.position !== undefined) {
      setPosition(playerState.position);
    }
  }, [playerState]);

  /**
   * Cuando currentTrack cambia, reproducimos la canción en el SDK.
   */
  useEffect(() => {
    if (!currentTrack || !deviceId) return;
    playTrackOnDevice(currentTrack.uri, deviceId).catch((err) =>
      console.error("Error al reproducir:", err),
    );
  }, [currentTrack, deviceId]);

  /**
   * Avanza el progreso local cada segundo mientras se reproduce.
   *
   * player_state_changed del SDK solo se dispara en eventos puntuales
   * — no en tiempo real. Por eso avanzamos position localmente.
   *
   * También detecta cuándo termina la canción y avanza automáticamente.
   */
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const interval = setInterval(() => {
      setPosition((prev) => {
        const next = prev + 1000;
        if (duration > 0 && next >= duration - 1000) {
          nextTrack();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, duration, nextTrack]);

  // ── Handlers ──────────────────────────────────────────────────────

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

  /**
   * Mueve la reproducción a una posición concreta (seek).
   * player.seek() acepta ms. Actualizamos position localmente para
   * que la UI responda inmediatamente.
   */
  async function handleSeek(e) {
    const newPosition = Number(e.target.value);
    setPosition(newPosition);
    await player?.seek(newPosition);
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

  const { name, artists, album } = currentTrack;
  const artistName = artists[0].name;
  const coverUrl = album.images[0]?.url;

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

      {/* ── Barra de progreso arrastrable ─────────────────────────── */}
      {/* input range permite arrastrar para hacer seek en ms */}
      <div className="player-panel__progress">
        <span className="player-panel__time">
          {formatDuration(displayPosition)}
        </span>
        <input
          className="player-panel__bar"
          type="range"
          min="0"
          max={duration}
          value={displayPosition}
          onChange={handleSeek}
        />
        <span className="player-panel__time">{formatDuration(duration)}</span>
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
 * Local a este componente porque solo lo usa PlayerPanel.
 */
function formatMs(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
