import { useState } from 'react'
import { loginWithSpotify } from '../auth/spotifyAuth.js'
import bliss from '../images/bliss.jpg'
import '../styles/Desktop.scss'



export default function Desktop() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="desktop" style={{ '--bliss': `url(${bliss})` }}>

      {/* Iconos del escritorio */}

      {/* Barra de tareas */}
      <div className="taskbar">

        {/* Botón inicio */}

        {/* Menú inicio (condicional) */}

        {/* System tray */}

      </div>
    </div>
  )
}