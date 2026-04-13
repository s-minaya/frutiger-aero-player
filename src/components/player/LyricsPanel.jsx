/**
 * LyricsPanel.jsx — Panel de letra de la canción actual
 *
 * Solo visible para usuarios Premium.
 * Muestra la letra de la canción que está sonando actualmente,
 * obtenida de lyrics.ovh.
 *
 * Estados visuales:
 * - Sin canción: mensaje invitando a reproducir
 * - Cargando: mensaje de espera
 * - Error: letra no disponible
 * - Con letra: texto de la letra con scroll
 *
 * @param {function} onBack — callback para volver a la vista anterior
 * @param {string} backLabel — texto del botón de volver
 */

import { useEffect, useState } from 'react'
import { usePlayer } from '../../hooks/usePlayer.js'
import { getLyrics } from '../../api/lyrics.js'
import './LyricsPanel.scss'

export default function LyricsPanel({ onBack, backLabel }) {
  const { currentTrack } = usePlayer()

  const [lyrics, setLyrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Carga la letra cada vez que cambia la canción.
   * Si no hay canción limpiamos el estado.
   */
  useEffect(() => {
    if (!currentTrack) {
      setLyrics(null)
      setError(null)
      return
    }

    async function fetchLyrics() {
      setLoading(true)
      setError(null)
      setLyrics(null)
      try {
        const text = await getLyrics(
          currentTrack.artists[0].name,
          currentTrack.name
        )
        setLyrics(text)
      } catch {
        setError('Letra no disponible para esta canción')
      } finally {
        setLoading(false)
      }
    }

    fetchLyrics()
  }, [currentTrack])

  return (
    <div className="lyrics-panel">

      {/* ── Botón volver ──────────────────────────────────────────── */}
      <button className="lyrics-panel__back" onClick={onBack}>
        ← {backLabel}
      </button>

      {/* ── Info de la canción actual ─────────────────────────────── */}
      {currentTrack && (
        <div className="lyrics-panel__track">
          <span className="lyrics-panel__title">{currentTrack.name}</span>
          <span className="lyrics-panel__artist">
            {currentTrack.artists[0].name}
          </span>
        </div>
      )}

      {/* ── Estados ───────────────────────────────────────────────── */}
      {!currentTrack && (
        <p className="lyrics-panel__status">
          🎵 Reproduce una canción para ver la letra
        </p>
      )}

      {loading && (
        <p className="lyrics-panel__status">Buscando letra...</p>
      )}

      {error && (
        <p className="lyrics-panel__status lyrics-panel__status--error">
          {error}
        </p>
      )}

      {/* ── Letra ─────────────────────────────────────────────────── */}
      {lyrics && (
        <pre className="lyrics-panel__lyrics">{lyrics}</pre>
      )}

    </div>
  )
}