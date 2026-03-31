import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlaylistPanel from '../../components/PlaylistPanel.jsx'

/**
 * Tests de integración de PlaylistPanel.
 *
 * En tests de integración verificamos que los componentes
 * renderizan correctamente y responden a props y estados.
 *
 * Mockeamos los hooks y la API para no hacer llamadas reales
 * a Spotify — los tests deben ser rápidos, predecibles y
 * funcionar sin conexión a internet.
 *
 * vi.mock intercepta los imports y los reemplaza por versiones
 * controladas por nosotros
 */

// Mockeamos usePlaylists para controlar qué datos recibe el componente
vi.mock('../../hooks/usePlaylists.js', () => ({
  usePlaylists: vi.fn(),
}))

// Mockeamos getPlaylistTracks para no hacer llamadas reales
vi.mock('../../api/playlists.js', () => ({
  getPlaylistTracks: vi.fn(),
}))

import { usePlaylists } from '../../hooks/usePlaylists.js'

describe('PlaylistPanel', () => {
  beforeEach(() => {
    // Limpiamos los mocks antes de cada test para que no
    // se contaminen entre sí con llamadas anteriores
    vi.clearAllMocks()
  })

  it('muestra mensaje de Premium si el usuario no tiene Premium', () => {
    // Si isPremium es false, el componente no debe mostrar playlists
    // sino un mensaje explicando que se necesita Premium.
    // Esto evita llamadas innecesarias a la API para usuarios free
    usePlaylists.mockReturnValue({
      playlists: [],
      loading: false,
      error: null,
    })

    render(<PlaylistPanel isPremium={false} />)

    expect(
      screen.getByText(/Las playlists requieren Spotify Premium/i)
    ).toBeInTheDocument()
  })

  it('muestra el loader mientras carga las playlists', () => {
    // Durante la carga el usuario debe ver feedback visual.
    // Sin esto la interfaz parece congelada y el usuario
    // no sabe si algo está pasando
    usePlaylists.mockReturnValue({
      playlists: [],
      loading: true,
      error: null,
    })

    render(<PlaylistPanel isPremium={true} />)

    expect(
      screen.getByText(/Cargando playlists/i)
    ).toBeInTheDocument()
  })

  it('muestra un error si la carga falla', () => {
    // Si la API falla, el usuario debe ver un mensaje de error
    // en vez de una pantalla en blanco sin explicación
    usePlaylists.mockReturnValue({
      playlists: [],
      loading: false,
      error: 'Spotify API error: 403',
    })

    render(<PlaylistPanel isPremium={true} />)

    expect(
      screen.getByText(/Spotify API error: 403/i)
    ).toBeInTheDocument()
  })

  it('muestra las playlists cuando cargan correctamente', () => {
    // El caso feliz — el usuario tiene Premium, la API responde bien
    // y las playlists aparecen en pantalla
    usePlaylists.mockReturnValue({
      playlists: [
        {
          id: '1',
          name: 'Mi playlist de prueba',
          images: [{ url: 'https://example.com/image.jpg' }],
          tracks: { total: 10 },
        },
        {
          id: '2',
          name: 'Otra playlist',
          images: [],
          tracks: { total: 5 },
        },
      ],
      loading: false,
      error: null,
    })

    render(<PlaylistPanel isPremium={true} />)

    expect(screen.getByText('Mi playlist de prueba')).toBeInTheDocument()
    expect(screen.getByText('Otra playlist')).toBeInTheDocument()
  })

  it('muestra el filtro de búsqueda cuando hay playlists', () => {
    // El input de filtro solo tiene sentido cuando hay playlists cargadas.
    // Verificamos que aparece en el estado correcto
    usePlaylists.mockReturnValue({
      playlists: [
        {
          id: '1',
          name: 'Mi playlist',
          images: [],
          tracks: { total: 5 },
        },
      ],
      loading: false,
      error: null,
    })

    render(<PlaylistPanel isPremium={true} />)

    expect(
      screen.getByPlaceholderText(/Filtrar playlists/i)
    ).toBeInTheDocument()
  })
})