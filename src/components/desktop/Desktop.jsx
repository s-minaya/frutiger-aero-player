/**
 * Desktop.jsx — Shell principal del escritorio Windows XP
 *
 * Estado del WMPlayer — dos variables separadas:
 * - playerMounted: si el WMP existe en el DOM (controla la taskbar)
 * - playerOpen: si la ventana del WMP es visible en pantalla
 *
 * Esto replica el comportamiento de Windows XP:
 * - Doble click en icono / click en StartMenu → monta Y abre (ambos true)
 * - Click fuera del WMP → solo oculta (playerOpen=false, playerMounted=true)
 * - Click en taskbar → alterna visibilidad (toggle playerOpen)
 * - Click en X del WMP → cierra completamente (ambos false)
 */

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

  // true cuando el menú Inicio está desplegado
  const [menuOpen, setMenuOpen] = useState(false);

  // true cuando la ventana del WMP es visible en pantalla
  const [playerOpen, setPlayerOpen] = useState(false);

  // true cuando el WMP existe en el DOM aunque esté oculto —
  // controla si aparece el botón en la taskbar
  const [playerMounted, setPlayerMounted] = useState(false);

  const { user, reload, loading, isPremium } = useAuth();

  // Ref al contenedor del botón Inicio + menú — para detectar clicks fuera
  const menuRef = useRef(null);

  // Ref al DOM del WMPlayer — pasado via forwardRef para detectar clicks fuera
  const wmpRef = useRef(null);

  // Ref al botón de WMP en la taskbar — excluido del listener de click fuera
  // del WMP para que su propio onClick gestione el toggle sin conflictos
  const taskbarWmpBtnRef = useRef(null);

  const formattedTime = time.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  /**
   * Cierra el menú Inicio al hacer click fuera de él.
   * Solo activa el listener cuando el menú está abierto para no
   * tener un listener permanente innecesario.
   */
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

  /**
   * Oculta el WMP al hacer click fuera de él.
   *
   * Excluimos el botón de taskbar del área de fuera porque
   * sin esta exclusión, al hacer click en el botón de taskbar se
   * dispararían DOS eventos — este listener (que oculta el WMP) y el
   * onClick del botón (que hace toggle). El resultado sería que el WMP
   * se ocultaría y se volvería a mostrar inmediatamente, sin efecto visible.
   *
   * Con la exclusión, el botón de taskbar gestiona el toggle él solo.
   */
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
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideWmp);
  }, [playerOpen]);

  /**
   * Actualiza el reloj cada segundo.
   * El cleanup con clearInterval evita memory leaks al desmontar.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mientras useAuth carga el perfil mostramos BootScreen
  if (loading) return <BootScreen />;

  return (
    // --bliss pasa la imagen importada como variable CSS para que
    // el SCSS pueda usarla con background-image: var(--bliss).
    // Vite procesa la imagen (hash, optimización) al importarla como módulo.
    <div className="desktop" style={{ "--bliss": `url(${bliss})` }}>
      {/* ── Iconos del escritorio ─────────────────────────────────────── */}
      <div className="desktop__icons">
        {/* Iconos decorativos — no tienen funcionalidad */}
        <DesktopIcon label="Buscaminas" icon={iconMinesweeper} />
        <DesktopIcon label="Paint" icon={iconPaint} />
        <DesktopIcon label="Space Channel 5" icon={iconSpaceChannel} />
        <DesktopIcon label="Messenger" icon={msnIcon} />
        <DesktopIcon label="Notepad" icon={iconNotepad} />

        {/* Icono funcional — doble click abre el WMP como en XP */}
        <DesktopIcon
          label="Windows Media Player"
          icon={iconWMP}
          onDoubleClick={() => {
            setPlayerMounted(true);
            setPlayerOpen(true);
          }}
        />
      </div>

      {/* ── WMPlayer ──────────────────────────────────────────────────── */}
      {/* Se monta cuando playerMounted es true y se oculta/muestra via
    isVisible. Mantenerlo montado aunque esté oculto permite que
    el SDK de Spotify siga corriendo y la música no se interrumpa
    al hacer click fuera. onClose lo desmonta completamente. */}
      {playerMounted && (
        <WMPlayer
          ref={wmpRef}
          isVisible={playerOpen}
          onClose={() => {
            setPlayerOpen(false);
            setPlayerMounted(false);
          }}
          isPremium={isPremium}
        />
      )}

      {/* ── Taskbar ───────────────────────────────────────────────────── */}
      <div className="taskbar">
        {/* Botón Inicio + menú desplegable — envueltos en el mismo div
            para que el ref de click fuera los trate como una sola unidad */}
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

          {/* Menú Inicio — renderizado condicionalmente sobre la taskbar */}
          {menuOpen && (
            <StartMenu
              onOpenPlayer={() => {
                setPlayerMounted(true);
                setPlayerOpen(true);
                setMenuOpen(false);
              }}
              onLogout={onShutdown}
              // onLogin permite hacer login desde el menú si el usuario
              // abrió el escritorio sin estar autenticado (edge case)
              onLogin={() => loginWithSpotifyPopup(() => reload())}
              user={user}
            />
          )}
        </div>

        {/* Botón del WMP en taskbar — solo visible cuando playerMounted es true.
            La clase --active indica visualmente que la ventana está abierta.
            El ref excluye este botón del listener de click fuera del WMP. */}
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

        {/* System tray — icono MSN decorativo y reloj en tiempo real */}
        <div className="system-tray">
          <img className="system-tray__icon" src={msnIcon} alt="MSN" />
          <span className="system-tray__time">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
}
