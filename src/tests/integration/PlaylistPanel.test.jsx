import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PlaylistPanel from '../../components/PlaylistPanel.jsx'
import { server } from '../mocks/server.js'
import { http, HttpResponse } from 'msw'


/**
 * Tests de integración de PlaylistPanel con MSW.
 *
 * Probamos la cadena completa:
 * PlaylistPanel → usePlaylists → getUserPlaylists → spotifyFetch → MSW
 *
 * Casos que cubrimos:
 * - Usuario sin Premium ve mensaje de bloqueo
 * - Usuario Premium ve sus playlists
 * - Click en playlist carga sus canciones
 * - Error de API se muestra correctamente
 */

beforeEach(() => {
  localStorage.setItem('sfa_access_token', 'fake_token')
  localStorage.setItem('sfa_expires_at', String(Date.now() + 3600 * 1000))
  localStorage.setItem('sfa_refresh_token', 'fake_refresh_token')
})

afterEach(() => {
  localStorage.clear()
})

describe('PlaylistPanel', () => {
  it('muestra mensaje de Premium si el usuario no tiene Premium', () => {
    // Los usuarios free no pueden ver playlists.
    // Este mensaje debe aparecer inmediatamente sin hacer
    // ninguna llamada a la API — es una decisión local
    render(<PlaylistPanel isPremium={false} />)

    expect(
      screen.getByText(/Las playlists requieren Spotify Premium/i)
    ).toBeInTheDocument()
  })

  it('muestra las playlists cuando el usuario tiene Premium', async () => {
    // Con Premium, usePlaylists hace la petición a la API.
    // MSW la intercepta y devuelve mockPlaylists.
    // Verificamos que los nombres aparecen en pantalla
    render(<PlaylistPanel isPremium={true} />)

    await waitFor(() => {
      expect(
        screen.getByText('Mi playlist favorita')
      ).toBeInTheDocument()
      expect(screen.getByText('Rock clásico')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('muestra el filtro de búsqueda cuando cargan las playlists', async () => {
    // El filtro solo tiene sentido cuando hay playlists.
    // Verificamos que aparece después de la carga
    render(<PlaylistPanel isPremium={true} />)

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Filtrar playlists/i)
      ).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('filtra playlists por nombre al escribir', async () => {
    // El filtro es local — no hace llamadas a la API.
    // Verificamos que al escribir "Rock" solo aparece
    // la playlist que contiene esa palabra
    render(<PlaylistPanel isPremium={true} />)

    await waitFor(() => {
      expect(screen.getByText('Mi playlist favorita')).toBeInTheDocument()
    }, { timeout: 1000 })

    fireEvent.change(
      screen.getByPlaceholderText(/Filtrar playlists/i),
      { target: { value: 'Rock' } }
    )

    expect(screen.getByText('Rock clásico')).toBeInTheDocument()
    expect(
      screen.queryByText('Mi playlist favorita')
    ).not.toBeInTheDocument()
  })

  it('muestra las canciones al hacer click en una playlist', async () => {
    // Al hacer click en una playlist, se hace una segunda petición
    // para cargar sus canciones. MSW la intercepta y devuelve
    // mockPlaylistTracks. Verificamos que las canciones aparecen
    render(<PlaylistPanel isPremium={true} />)

    await waitFor(() => {
      expect(screen.getByText('Mi playlist favorita')).toBeInTheDocument()
    }, { timeout: 1000 })

    fireEvent.click(screen.getByText('Mi playlist favorita'))

    await waitFor(() => {
      expect(screen.getByText('Creep')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('muestra error si la API falla al cargar playlists', async () => {
    // Sobreescribimos el handler para simular un error de servidor.
    // El usuario debe ver un mensaje claro en vez de una pantalla vacía
    server.use(
      http.get('https://api.spotify.com/v1/me/playlists', () => {
        return HttpResponse.json(
          { error: { status: 500, message: 'Internal Server Error' } },
          { status: 500 }
        )
      })
    )

    render(<PlaylistPanel isPremium={true} />)

    await waitFor(() => {
      expect(
        screen.getByText(/Internal Server Error/i)
      ).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})