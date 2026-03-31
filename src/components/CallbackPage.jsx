import { useEffect } from 'react'
import { exchangeCodeForTokens } from '../auth/tokenManager.js'
import BootScreen from './screens/BootScreen.jsx'

export default function CallbackPage() {
  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const error = params.get('error')

      if (error) {
        window.close()
        return
      }

      if (!code) return

      try {
        await exchangeCodeForTokens(code)
        // Avisa a la ventana padre
        window.opener?.postMessage('spotify-login-success', window.location.origin)
        // Se cierra sola
        window.close()
      } catch (err) {
        console.error(err)
        window.close()
      }
    }

    handleCallback()
  }, [])

  return <BootScreen />
}