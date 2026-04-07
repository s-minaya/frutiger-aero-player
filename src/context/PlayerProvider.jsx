/**
 * Proveedor del estado global del reproductor
 *
 * Envuelve a WMPlayer y todos sus hijos (SearchPanel, PlaylistPanel,
 * PlayerPanel) dándoles acceso al estado del reproductor sin necesidad
 * de pasar props por cada nivel.
 *
 * Estado que centraliza:
 * - currentTrack: canción seleccionada actualmente o null
 * - queue: lista completa de canciones disponibles para reproducir
 *   (los resultados de búsqueda o las canciones de una playlist)
 * - currentIndex: posición de currentTrack dentro de queue
 * - isPlaying: si la reproducción está activa
 * - volume: volumen de 0 a 1
 *
 * Funciones que expone:
 * - playTrack(track, queue): selecciona una canción y guarda su contexto
 * - nextTrack(): avanza a la siguiente canción de la queue
 * - previousTrack(): retrocede a la canción anterior de la queue
 * - togglePlay(): alterna entre play y pause
 * - setVolume(v): actualiza el volumen
 */
import { useState } from "react";
import { PlayerContext } from "./PlayerContext.jsx";

export function PlayerProvider({ children }) {
  // Objeto track completo de Spotify o null si no hay nada seleccionado
  // { id, name, uri, artists, album, duration_ms, preview_url, ... }
  const [currentTrack, setCurrentTrack] = useState(null);

  // Lista completa de canciones del contexto actual de reproducción.
  // Se actualiza cada vez que el usuario hace click en una canción:
  // - Desde SearchPanel: los resultados de la búsqueda actual
  // - Desde PlaylistPanel: las canciones de la playlist seleccionada
  // Permite a nextTrack() y previousTrack() saber qué viene antes/después
  const [queue, setQueue] = useState([]);

  // Índice de currentTrack dentro de queue.
  // -1 si no hay canción seleccionada.
  const [currentIndex, setCurrentIndex] = useState(-1);

  // true cuando está reproduciendo, false cuando está en pausa
  const [isPlaying, setIsPlaying] = useState(false);

  // Volumen de 0 a 1 — empezamos al 80% para no asustar al usuario
  const [volume, setVolume] = useState(0.8);

  /**
   * Selecciona una canción y guarda su contexto de reproducción.
   *
   * @param {object} track - Objeto track completo de Spotify
   * @param {Array}  trackQueue - Lista completa de canciones del contexto actual
   *
   * Ejemplo desde SearchPanel:
   *   playTrack(track, results) // results = todos los resultados de búsqueda
   *
   * Ejemplo desde PlaylistPanel:
   *   playTrack(item, tracks.map(({item}) => item).filter(Boolean))
   *
   * Guardamos la queue completa para que nextTrack() y previousTrack()
   * puedan navegar por las canciones correctas — respetando el orden
   * en que aparecen en los resultados o en la playlist.
   */
  function playTrack(track, trackQueue = []) {
    const index = trackQueue.findIndex((t) => t.id === track.id);
    setCurrentTrack(track);
    setQueue(trackQueue);
    setCurrentIndex(index);
    setIsPlaying(true);
  }

  /**
   * Avanza a la siguiente canción de la queue.
   * Si estamos en la última canción, no hace nada.
   */
  function nextTrack() {
    if (currentIndex < 0 || currentIndex >= queue.length - 1) return;
    const next = queue[currentIndex + 1];
    setCurrentTrack(next);
    setCurrentIndex(currentIndex + 1);
    setIsPlaying(true);
  }

  /**
   * Retrocede a la canción anterior de la queue.
   * Si estamos en la primera canción, no hace nada.
   */
  function previousTrack() {
    if (currentIndex <= 0) return;
    const prev = queue[currentIndex - 1];
    setCurrentTrack(prev);
    setCurrentIndex(currentIndex - 1);
    setIsPlaying(true);
  }

  /**
   * Alterna entre play y pause.
   * El guard !currentTrack evita togglear si no hay canción.
   */
  function togglePlay() {
    if (!currentTrack) return;
    setIsPlaying((prev) => !prev);
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        currentIndex,
        isPlaying,
        volume,
        setVolume,
        playTrack,
        nextTrack,
        previousTrack,
        togglePlay,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
