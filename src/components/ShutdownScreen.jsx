import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearTokens } from '../auth/tokenManager.js'
import '../styles/ShutdownScreen.scss'

export default function ShutdownScreen({ onDone }) {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      clearTokens()
      navigate('/login')
      onDone?.()
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate, onDone])

  return (
    <div className="shutdown-screen">
      <p className="shutdown-screen__text">Cerrando sesión...</p>
    </div>
  )
}