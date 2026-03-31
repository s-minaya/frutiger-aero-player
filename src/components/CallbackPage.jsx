/**
 * CallbackPage.jsx — Gestiona el retorno de Spotify tras el login
 *
 * Esta página se carga dentro del popup que abrió loginWithSpotifyPopup().
 * Spotify redirige aquí con uno de estos dos casos en la URL:
 *
 * ÉXITO:  /callback?code=AQD...  (código de autorización)
 * ERROR:  /callback?error=access_denied  (usuario canceló o error)
 *
 * Flujo en caso de éxito:
 * 1. Extrae el code de la URL
 * 2. Lo intercambia por access_token + refresh_token (tokenManager.js)
 * 3. Avisa a la ventana padre con postMessage
 * 4. Se cierra sola
 *
 * La ventana padre (Desktop o LoginScreen) está escuchando el mensaje
 * 'spotify-login-success' en spotifyAuth.js y ejecuta onSuccess()
 * cuando lo recibe — lo que actualiza el estado de la app sin recargar.
 *
 * Mientras se procesa el callback mostramos BootScreen — el usuario
 * ve la pantalla de arranque de XP durante el breve momento de carga.
 */

import { useEffect } from 'react'
import { exchangeCodeForTokens } from '../auth/tokenManager.js'
import BootScreen from './screens/BootScreen.jsx'

export default function CallbackPage() {
  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const error = params.get('error')

      // El usuario canceló el login en Spotify o hubo un error de autorización
      // No hay nada que hacer — cerramos el popup silenciosamente
      if (error) {
        window.close()
        return
      }

      // Sin code no podemos hacer el intercambio — situación inesperada
      // (no debería ocurrir si el flujo es correcto)
      if (!code) return

      try {
        // Intercambiamos el code por tokens — esto llama a /api/token
        // con el code + code_verifier que guardamos al inicio del flujo
        await exchangeCodeForTokens(code)

        // Avisamos a la ventana padre que el login fue exitoso.
        // window.location.origin como targetOrigin es una medida de seguridad —
        // el mensaje solo llega a ventanas del mismo dominio
        window.opener?.postMessage('spotify-login-success', window.location.origin)

        // El popup ya ha hecho su trabajo — se cierra solo
        window.close()
      } catch (err) {
        // Si el intercambio falla (code expirado, verifier perdido...)
        // cerramos igualmente — el usuario tendrá que intentar el login de nuevo
        console.error(err)
        window.close()
      }
    }

    handleCallback()
  }, []) // sin dependencias — solo se ejecuta al montar, una sola vez

  // Mostramos BootScreen mientras se procesa el callback
  return <BootScreen />
}