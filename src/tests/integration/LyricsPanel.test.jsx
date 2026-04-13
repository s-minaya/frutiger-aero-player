import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import LyricsPanel from '../../components/player/LyricsPanel.jsx'
import { PlayerProvider } from '../../context/PlayerProvider.jsx'
import { usePlayer } from '../../hooks/usePlayer.js'

/**
 * Tests de LyricsPanel con vi.mock.
 *
 * Mockeamos getLyrics directamente porque lyrics.ovh no es la API
 * de Spotify — MSW está configurado para interceptar api.spotify.com.
 * Para una API externa sin autenticación, vi.mock es más sencillo.
 *
 * Mockeamos usePlayer para controlar currentTrack en cada test
 * sin necesidad de montar el PlayerProvider y reproducir canciones.
 */

vi.mock('../../api/lyrics.js', () => ({
  getLyrics: vi.fn()
}))

vi.mock('../../hooks/usePlayer.js', () => ({
  usePlayer: vi.fn()
}))

import { getLyrics } from '../../api/lyrics.js'

const mockTrack = {
  id: '1',
  name: 'Creep',
  artists: [{ name: 'Radiohead' }],
  album: { name: 'Pablo Honey', images: [] },
  duration_ms: 238000,
}

describe('LyricsPanel', () => {
  beforeEach(() => {
    // Por defecto simulamos que hay una canción reproduciéndose
    usePlayer.mockReturnValue({ currentTrack: mockTrack })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('muestra mensaje cuando no hay canción', () => {
    // Sin canción el panel invita a reproducir algo
    usePlayer.mockReturnValue({ currentTrack: null })

    render(<LyricsPanel onBack={vi.fn()} backLabel="Volver a búsqueda" />)

    expect(
      screen.getByText(/Reproduce una canción para ver la letra/i)
    ).toBeInTheDocument()
  })

  it('muestra el estado de carga mientras busca la letra', async () => {
    // getLyrics nunca resuelve — quedamos en estado loading
    getLyrics.mockReturnValue(new Promise(() => {}))

    render(<LyricsPanel onBack={vi.fn()} backLabel="Volver a búsqueda" />)

    await waitFor(() => {
      expect(screen.getByText(/Buscando letra/i)).toBeInTheDocument()
    })
  })

  it('muestra la letra cuando la API responde', async () => {
    // getLyrics resuelve con la letra
    getLyrics.mockResolvedValue('I\'m a creep\nI\'m a weirdo')

    render(<LyricsPanel onBack={vi.fn()} backLabel="Volver a búsqueda" />)

    await waitFor(() => {
      expect(screen.getByText(/I'm a creep/i)).toBeInTheDocument()
    })
  })

  it('muestra error cuando la letra no está disponible', async () => {
    // getLyrics lanza un error
    getLyrics.mockRejectedValue(new Error('Letra no disponible'))

    render(<LyricsPanel onBack={vi.fn()} backLabel="Volver a búsqueda" />)

    await waitFor(() => {
      expect(
        screen.getByText(/Letra no disponible para esta canción/i)
      ).toBeInTheDocument()
    })
  })

  it('muestra el nombre y artista de la canción actual', async () => {
    getLyrics.mockResolvedValue('I\'m a creep')

    render(<LyricsPanel onBack={vi.fn()} backLabel="Volver a búsqueda" />)

    await waitFor(() => {
      expect(screen.getByText('Creep')).toBeInTheDocument()
      expect(screen.getByText('Radiohead')).toBeInTheDocument()
    })
  })

  it('muestra el botón de volver con el texto correcto', () => {
    getLyrics.mockReturnValue(new Promise(() => {}))

    render(<LyricsPanel onBack={vi.fn()} backLabel="Volver a playlist" />)

    expect(screen.getByText(/Volver a playlist/i)).toBeInTheDocument()
  })

  it('llama a onBack al hacer click en volver', () => {
    getLyrics.mockReturnValue(new Promise(() => {}))
    const onBack = vi.fn()

    render(<LyricsPanel onBack={onBack} backLabel="Volver a búsqueda" />)

    fireEvent.click(screen.getByText(/Volver a búsqueda/i))

    expect(onBack).toHaveBeenCalledOnce()
  })
})