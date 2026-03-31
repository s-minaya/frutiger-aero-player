import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchPanel from '../../components/SearchPanel.jsx'

/**
 * Tests de integración de SearchPanel.
 *
 * SearchPanel tiene más estados que PlaylistPanel:
 * - Sin búsqueda (estado inicial)
 * - Cargando (debounce en curso)
 * - Con resultados
 * - Sin resultados
 * - Con error
 *
 * Mockeamos useSearch para controlar estos estados
 * sin depender del debounce real ni de la API de Spotify.
 *
 * fireEvent simula interacciones del usuario — escribir en el input,
 * hacer click, etc. sin necesitar un navegador real
 */

vi.mock('../../hooks/useSearch.js', () => ({
  useSearch: vi.fn(),
}))

vi.mock('../../api/search.js', () => ({
  formatDuration: vi.fn(() => '3:00'), // valor fijo para simplificar
  searchTracks: vi.fn(),
}))

import { useSearch } from '../../hooks/useSearch.js'

describe('SearchPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra el input de búsqueda en el estado inicial', () => {
    // El input debe estar siempre visible — es el punto de entrada
    // principal del componente. Sin él el usuario no puede buscar
    useSearch.mockReturnValue({
      query: '',
      setQuery: vi.fn(),
      results: [],
      loading: false,
      error: null,
    })

    render(<SearchPanel />)

    expect(
      screen.getByPlaceholderText(/Buscar canciones/i)
    ).toBeInTheDocument()
  })

  it('no muestra resultados ni mensajes en el estado inicial', () => {
    // Con query vacía no debe haber resultados ni mensajes de error.
    // Mostrar "no se encontraron resultados" sin que el usuario
    // haya buscado nada sería confuso
    useSearch.mockReturnValue({
      query: '',
      setQuery: vi.fn(),
      results: [],
      loading: false,
      error: null,
    })

    render(<SearchPanel />)

    expect(
      screen.queryByText(/No se encontraron resultados/i)
    ).not.toBeInTheDocument()
  })

  it('llama a setQuery cuando el usuario escribe', () => {
    // Verificamos que el input está conectado al estado.
    // Si setQuery no se llama, el debounce nunca se activa
    // y la búsqueda nunca ocurre
    const setQuery = vi.fn()
    useSearch.mockReturnValue({
      query: '',
      setQuery,
      results: [],
      loading: false,
      error: null,
    })

    render(<SearchPanel />)

    const input = screen.getByPlaceholderText(/Buscar canciones/i)
    fireEvent.change(input, { target: { value: 'radiohead' } })

    expect(setQuery).toHaveBeenCalledWith('radiohead')
  })

  it('muestra el estado de carga mientras busca', () => {
    // El usuario debe saber que su búsqueda está en curso.
    // Sin feedback de carga la interfaz parece no responder
    useSearch.mockReturnValue({
      query: 'radiohead',
      setQuery: vi.fn(),
      results: [],
      loading: true,
      error: null,
    })

    render(<SearchPanel />)

    expect(screen.getByText(/Buscando/i)).toBeInTheDocument()
  })

  it('muestra mensaje cuando no hay resultados', () => {
    // Si la búsqueda no devuelve nada, el usuario debe saberlo.
    // Sin este mensaje podría pensar que la búsqueda no funcionó
    useSearch.mockReturnValue({
      query: 'xkzjqwerty12345',
      setQuery: vi.fn(),
      results: [],
      loading: false,
      error: null,
    })

    render(<SearchPanel />)

    expect(
      screen.getByText(/No se encontraron resultados/i)
    ).toBeInTheDocument()
  })

  it('muestra el error si la búsqueda falla', () => {
    // Si la API falla, el usuario debe ver qué ha pasado.
    // Un error silencioso haría que el usuario pensara
    // que no hay resultados cuando en realidad hay un problema
    useSearch.mockReturnValue({
      query: 'radiohead',
      setQuery: vi.fn(),
      results: [],
      loading: false,
      error: 'Spotify API error: 429',
    })

    render(<SearchPanel />)

    expect(
      screen.getByText(/Spotify API error: 429/i)
    ).toBeInTheDocument()
  })

  it('muestra los resultados cuando la búsqueda tiene éxito', () => {
    // El caso feliz — la búsqueda devuelve canciones y se muestran.
    // Verificamos nombre y artista porque son los datos
    // más importantes para que el usuario identifique la canción
    useSearch.mockReturnValue({
      query: 'creep',
      setQuery: vi.fn(),
      results: [
        {
          id: '1',
          name: 'Creep',
          duration_ms: 238000,
          artists: [{ name: 'Radiohead' }],
          album: {
            name: 'Pablo Honey',
            images: [
              { url: 'https://example.com/large.jpg' },
              { url: 'https://example.com/medium.jpg' },
              { url: 'https://example.com/small.jpg' },
            ],
          },
        },
        {
          id: '2',
          name: 'Karma Police',
          duration_ms: 264000,
          artists: [{ name: 'Radiohead' }],
          album: {
            name: 'OK Computer',
            images: [
              { url: 'https://example.com/large.jpg' },
              { url: 'https://example.com/medium.jpg' },
              { url: 'https://example.com/small.jpg' },
            ],
          },
        },
      ],
      loading: false,
      error: null,
    })

    render(<SearchPanel />)

    expect(screen.getByText('Creep')).toBeInTheDocument()
    expect(screen.getByText('Karma Police')).toBeInTheDocument()
    expect(screen.getAllByText('Radiohead')).toHaveLength(2)
  })
})