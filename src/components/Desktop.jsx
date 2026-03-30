import { useState, useEffect, useRef } from "react";
import { loginWithSpotifyPopup } from "../auth/spotifyAuth.js";
import { useAuth } from "../hooks/useAuth.js";
import "../styles/Desktop.scss";
import DesktopIcon from "./DesktopIcon.jsx";
import StartMenu from "./StartMenu.jsx";
import BootScreen from "./BootScreen.jsx";
import WMPlayer from './WMPlayer.jsx'
import bliss from "../images/bliss.jpg";
import startIcon from "../images/xp-logo.png";
import msnIcon from "../images/msn-icon.png";
import iconPaint from "../images/paint.webp";
import iconMinesweeper from "../images/minesweeper.png";
import iconSpaceChannel from "../images/space-channel-5.PNG";
import iconNotepad from "../images/notepad.png";
import iconWMP from "../images/wmp.webp";

export default function Desktop({ onShutdown }) {
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const { user, reload, loading } = useAuth();
  const menuRef = useRef(null);

  const formattedTime = time.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <BootScreen />;

  return (
    <div className="desktop" style={{ "--bliss": `url(${bliss})` }}>
      {/* Iconos del escritorio */}
      <div className="desktop__icons">
        <DesktopIcon label="Buscaminas" icon={iconMinesweeper} />
        <DesktopIcon label="Paint" icon={iconPaint} />
        <DesktopIcon label="Space Channel 5" icon={iconSpaceChannel} />
        <DesktopIcon label="Messenger" icon={msnIcon} />
        <DesktopIcon label="Notepad" icon={iconNotepad} />
        <DesktopIcon
          label="Windows Media Player"
          icon={iconWMP}
          onDoubleClick={() => setPlayerOpen(true)}
        />
      </div>
      {playerOpen && <WMPlayer onClose={() => setPlayerOpen(false)} />}

      {/* Barra de tareas */}
      <div className="taskbar">
        {/* Botón inicio */}
        <div ref={menuRef} className="taskbar__start">
          <button
            className="start-button"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <img
              className="start-button_img"
              src={startIcon}
              alt="Logo windows xp"
            />
            <span>Inicio</span>
          </button>

          {/* Menú inicio  */}
          {menuOpen && (
            <StartMenu
              onOpenPlayer={() => {
                setPlayerOpen(true);
                setMenuOpen(false);
              }}
              onLogout={onShutdown}
              onLogin={() => loginWithSpotifyPopup(() => reload())}
              user={user}
            />
          )}
          
        </div>

        {/* System tray */}
        <div className="system-tray">
          <img className="system-tray__icon" src={msnIcon} alt="MSN" />
          <span className="system-tray__time">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
}
