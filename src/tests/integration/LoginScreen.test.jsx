import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginScreen from '../../components/LoginScreen.jsx'

/**
 * Tests de integración de LoginScreen.
 *
 * LoginScreen es la primera pantalla que ve el usuario.
 * Es crítico que:
 * - Muestre el logo y el usuario correctamente
 * - El click en el usuario inicie el login con Spotify
 * - El botón de apagar llame a onShutdown
 *
 * Mockeamos loginWithSpotifyPopup y useAuth para no
 * depender de la API de Spotify ni del estado de autenticación.
 *
 * MemoryRouter es necesario porque LoginScreen usa
 * useNavigate internamente — sin un router React se queja
 */

import { MemoryRouter } from 'react-router-dom'

vi.mock('../../auth/spotifyAuth.js', () => ({
  loginWithSpotifyPopup: vi.fn(),
}))

vi.mock('../../hooks/useAuth.js', () => ({
  useAuth: vi.fn(),
}))

import { loginWithSpotifyPopup } from '../../auth/spotifyAuth.js'
import { useAuth } from '../../hooks/useAuth.js'

// Helper para renderizar con el router necesario
function renderLoginScreen(props = {}) {
  return render(
    <MemoryRouter>
      <LoginScreen {...props} />
    </MemoryRouter>
  )
}

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Por defecto simulamos que no hay usuario logueado
    useAuth.mockReturnValue({
      reload: vi.fn(),
    })
  })

  it('muestra el texto para iniciar sesión', () => {
    // El usuario debe saber qué tiene que hacer.
    // Sin instrucciones claras podría no saber que tiene
    // que hacer click en el avatar para iniciar sesión
    renderLoginScreen()

    expect(
      screen.getByText(/Para comenzar, haz clic en tu usuario/i)
    ).toBeInTheDocument()
  })

  it('muestra el nombre de usuario por defecto', () => {
    // Antes de iniciar sesión, mostramos "Usuario" como placeholder.
    // Es importante que haya algo visible para que el usuario
    // sepa dónde tiene que hacer click
    renderLoginScreen()

    expect(screen.getByText('Usuario')).toBeInTheDocument()
  })

  it('llama a loginWithSpotifyPopup al hacer click en el usuario', () => {
    // El click en el avatar es el punto de entrada al flujo de login.
    // Si este handler no se ejecuta, el usuario no puede autenticarse
    renderLoginScreen()

    const userDiv = screen.getByText('Usuario').closest('div')
    fireEvent.click(userDiv)

    expect(loginWithSpotifyPopup).toHaveBeenCalledTimes(1)
  })

  it('muestra el botón de apagar equipo', () => {
    // El botón de apagar debe estar siempre visible en el pie.
    // Es la única forma de "salir" de la pantalla de login
    renderLoginScreen()

    expect(
      screen.getByText(/Apagar el equipo/i)
    ).toBeInTheDocument()
  })

  it('llama a onShutdown al pulsar apagar equipo', () => {
    // Verificamos que el botón está conectado al handler.
    // Si onShutdown no se llama, la animación de apagado
    // nunca se activará
    const onShutdown = vi.fn()
    renderLoginScreen({ onShutdown })

    fireEvent.click(screen.getByText(/Apagar el equipo/i))

    expect(onShutdown).toHaveBeenCalledTimes(1)
  })
})