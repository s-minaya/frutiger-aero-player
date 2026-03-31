import { useState, useEffect, useRef } from "react";
import { loginWithSpotifyPopup } from "../../auth/spotifyAuth.js";
import { useAuth } from "../../hooks/useAuth.js";
import "./Desktop.scss";
import DesktopIcon from "./DesktopIcon.jsx";
import StartMenu from "./StartMenu.jsx";
import BootScreen from "../screens/BootScreen.jsx";
import WMPlayer from "../player/WMPlayer.jsx";
import bliss from "../../assets/wallpaper/bliss.jpg";
import startIcon from "../../assets/branding/xp-logo.png";
import msnIcon from "../../assets/icons/msn-icon.png";
import iconPaint from "../../assets/icons/paint.webp";
import iconMinesweeper from "../../assets/icons/minesweeper.png";
import iconSpaceChannel from "../../assets/icons/space-channel-5.PNG";
import iconNotepad from "../../assets/icons/notepad.png";
import iconWMP from "../../assets/icons/wmp.webp";

export default function Desktop({ onShutdown }) {
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerMounted, setPlayerMounted] = useState(false);
  const { user, reload, loading, isPremium } = useAuth();
  const menuRef = useRef(null);
  const wmpRef = useRef(null);
  const taskbarWmpBtnRef = useRef(null);

  const formattedTime = time.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Click fuera del menú inicio → cerrarlo
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

  // Click fuera del WMP → minimizarlo (queda en taskbar).
  // Excluimos el botón de taskbar: su propio onClick ya gestiona el toggle
  // y procesarlo aquí también causaría que se volviera a abrir inmediatamente.
  useEffect(() => {
    if (!playerOpen) return;
    function handleClickOutsideWmp(e) {
      if (
        wmpRef.current &&
        !wmpRef.current.contains(e.target) &&
        !taskbarWmpBtnRef.current?.contains(e.target)
      ) {
        setPlayerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideWmp);
    return () => document.removeEventListener("mousedown", handleClickOutsideWmp);
  }, [playerOpen]);

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
          onDoubleClick={() => {
            setPlayerMounted(true);
            setPlayerOpen(true);
          }}
        />
      </div>

      {/* WMPlayer — se monta solo cuando está visible; la taskbar se controla con playerMounted */}
      {playerMounted && playerOpen && (
        <WMPlayer
          ref={wmpRef}
          onClose={() => {
            setPlayerOpen(false);
            setPlayerMounted(false);
          }}
          isPremium={isPremium}
        />
      )}

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

          {/* Menú inicio */}
          {menuOpen && (
            <StartMenu
              onOpenPlayer={() => {
                setPlayerMounted(true);
                setPlayerOpen(true);
                setMenuOpen(false);
              }}
              onLogout={onShutdown}
              onLogin={() => loginWithSpotifyPopup(() => reload())}
              user={user}
            />
          )}
        </div>

        {/* Botón WMP en taskbar — visible cuando el player está montado */}
        {playerMounted && (
          <button
            ref={taskbarWmpBtnRef}
            className={`taskbar__app ${playerOpen ? "taskbar__app--active" : ""}`}
            onClick={() => setPlayerOpen((open) => !open)}
          >
            <img className="taskbar__app-icon" src={iconWMP} alt="" />
            <span>Windows Media Player</span>
          </button>
        )}

        {/* System tray */}
        <div className="system-tray">
          <img className="system-tray__icon" src={msnIcon} alt="MSN" />
          <span className="system-tray__time">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
}
