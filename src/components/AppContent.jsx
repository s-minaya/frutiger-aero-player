/**
 * AppContent.jsx — Routing, guards y estado global de la app
 *
 * Vive dentro del BrowserRouter (montado en App.jsx) lo que le permite
 * usar hooks de React Router como useNavigate, y hooks propios como
 * useAuth que en el futuro podrían necesitar el contexto del router.
 *
 * Responsabilidades:
 * 1. Mostrar BootScreen mientras useAuth carga el perfil del usuario
 * 2. Gestionar el estado de apagado (shuttingDown) que superpone
 *    ShutdownScreen sobre cualquier ruta
 * 3. Definir las rutas y protegerlas con PrivateRoute
 * 4. Pasar onShutdown a LoginScreen y Desktop para que ambos
 *    puedan activar la animación de apagado
 */

import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { isLoggedIn } from '../auth/tokenManager.js'
import LoginScreen from './screens/LoginScreen.jsx'
import Desktop from './desktop/Desktop.jsx'
import CallbackPage from './CallbackPage.jsx'
import ShutdownScreen from './screens/ShutdownScreen.jsx'
import BootScreen from './screens/BootScreen.jsx'

/**
 * Guard de rutas privadas.
 *
 * Comprueba isLoggedIn() — síncrono, lee localStorage directamente —
 * en vez de usar el estado de useAuth (asíncrono).
 *
 * Por qué no usamos useAuth aquí:
 * useAuth tiene un estado loading inicial. Si lo usáramos, habría un
 * flash donde PrivateRoute ve user=null y redirige a /login antes de
 * que termine de cargar. isLoggedIn() es instantáneo y evita ese flash.
 *
 * Si no hay tokens → redirige a /login
 * Si hay tokens → renderiza el componente hijo
 */
function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

export default function AppContent() {
  const { loading } = useAuth()

  /**
   * Estado de apagado — cuando es true se superpone ShutdownScreen
   * sobre toda la app con la animación de cierre de sesión.
   *
   * Se activa desde dos sitios:
   * - LoginScreen → botón "Apagar el equipo" (antes de iniciar sesión)
   * - Desktop → botón "Cerrar sesión" del StartMenu
   *
   * onDone lo resetea a false cuando ShutdownScreen termina su animación,
   * aunque en la práctica ShutdownScreen navega a /login antes de llamarlo.
   */
  const [shuttingDown, setShuttingDown] = useState(false)

  // Mientras useAuth carga el perfil mostramos la pantalla de boot XP.
  // Esto evita que el usuario vea un flash de contenido sin datos
  // o que PrivateRoute redirija incorrectamente por user=null.
  if (loading) return <BootScreen />

  return (
    <>
      {/* ShutdownScreen se superpone sobre las rutas con position:fixed
          z-index:9999 — no desmonta la ruta actual, solo la tapa */}
      {shuttingDown && (
        <ShutdownScreen onDone={() => setShuttingDown(false)} />
      )}

      <Routes>
        {/* Pantalla de login — siempre accesible */}
        <Route
          path="/login"
          element={<LoginScreen onShutdown={() => setShuttingDown(true)} />}
        />

        {/* Callback OAuth — gestiona el retorno del popup de Spotify
            y cierra la ventana popup tras intercambiar el code por tokens */}
        <Route path="/callback" element={<CallbackPage />} />

        {/* Escritorio — protegido por PrivateRoute
            Si no hay sesión redirige a /login automáticamente */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Desktop onShutdown={() => setShuttingDown(true)} />
            </PrivateRoute>
          }
        />

        {/* Cualquier ruta desconocida redirige al inicio */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}