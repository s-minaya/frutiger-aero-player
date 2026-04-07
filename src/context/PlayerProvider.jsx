/**
 * Proveedor del estado global del reproductor
 *
 * Envuelve a WMPlayer y todos sus hijos (SearchPanel, PlaylistPanel,
 * PlayerPanel) dándoles acceso al estado del reproductor sin necesidad
 * de pasar props por cada nivel.
 *
 * Estado que centraliza:
 * - currentTrack: canción seleccionada actualmente o null
 * - isPlaying: si la reproducción está activa
 * - volume: volumen de 0 a 1
 *
 * Funciones que expone:
 * - playTrack(track): selecciona una canción y empieza a reproducir
 * - togglePlay(): alterna entre play y pause
 * - setVolume(v): actualiza el volumen
 */
import { useState } from "react";
import { PlayerContext } from "./PlayerContext.jsx";

export function PlayerProvider({ children }) {
  // Objeto track completo de Spotify o null si no hay nada seleccionado
  // { id, name, artists, album, duration_ms, preview_url, ... }
  const [currentTrack, setCurrentTrack] = useState(null);
  // true cuando está reproduciendo, false cuando está en pausa
  const [isPlaying, setIsPlaying] = useState(false);

  // Volumen de 0 a 1 — empezamos al 80% para no asustar al usuario
  const [volume, setVolume] = useState(0.8);

  /**
   * Selecciona una canción y empieza a reproducirla.
   * Se llamará desde SearchPanel y PlaylistPanel al hacer
   * click en una canción.
   */
  function playTrack(track) {
    setCurrentTrack(track);
    setIsPlaying(true);
  }

  function togglePlay() {
    if (!currentTrack) return;
    setIsPlaying((prev) => !prev);
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        setVolume,
        playTrack,
        togglePlay,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
