import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { isLoggedIn } from '../auth/tokenManager.js'
import LoginScreen from './LoginScreen.jsx'
import Desktop from './Desktop.jsx'
import CallbackPage from './CallbackPage.jsx'
import ShutdownScreen from './ShutdownScreen.jsx'
import BootScreen from './BootScreen.jsx'

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

export default function AppContent() {
  const { loading } = useAuth()
  const [shuttingDown, setShuttingDown] = useState(false)

  if (loading) return <BootScreen />

  return (
    <>
      {shuttingDown && <ShutdownScreen onDone={() => setShuttingDown(false)} />}
      <Routes>
        <Route path="/login" element={<LoginScreen onShutdown={() => setShuttingDown(true)} />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/" element={
          <PrivateRoute>
            <Desktop onShutdown={() => setShuttingDown(true)} />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}