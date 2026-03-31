import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/app.scss'
import App from './components/App.jsx'

async function prepare() {
  // Solo activamos MSW si la variable de entorno VITE_MSW está activa.
  // Así en desarrollo normal la app llama a la API real de Spotify
  if (import.meta.env.VITE_MSW === 'true') {
    const { worker } = await import('./tests/mocks/browser.js')
    await worker.start({
      onUnhandledRequest: 'warn',
      serviceWorker: {
        url: `${import.meta.env.BASE_URL}mockServiceWorker.js`
      }
    })
  }
}

prepare().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
