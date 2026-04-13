/**
 * WMPlayer.jsx — Ventana del reproductor Windows Media Player
 *
 * Por qué usa forwardRef:
 * Desktop.jsx necesita una ref al nodo DOM del WMP para detectar clicks
 * fuera y minimizar la ventana. Como WMPlayer es un componente hijo,
 * la única forma de exponer su nodo DOM al padre es con forwardRef.
 * Sin forwardRef, ref={wmpRef} en Desktop.jsx apuntaría al componente
 * React, no al div del DOM, y .contains() no funcionaría.
 *
 * Por qué useSpotifyPlayer vive aquí y no en PlayerPanel:
 * El SDK de Spotify se desmontaría cada vez que el usuario cambia de tab,
 * perdiendo la conexión y mostrando "Conectando..." al volver al Player.
 * Al inicializarlo en WMPlayer, el SDK vive mientras el reproductor
 * esté abierto independientemente del tab activo.
 *
 * Ciclo de vida controlado por Desktop.jsx:
 * - Se monta cuando playerMounted es true (independientemente de playerOpen)
 * - Click fuera → playerOpen=false, se oculta con wmp--hidden pero
 *   sigue montado — el SDK y la música continúan
 * - Click en X → onClose() pone playerMounted=false y playerOpen=false
 *   (el componente se desmonta completamente y la música para)
 * - Click en taskbar → toggle de playerOpen (mostrar/ocultar)
 *
 * Drag:
 * La posición del WMP se gestiona localmente con estado {x, y}.
 * Se usa Pointer Events API en vez de mouse/touch por separado —
 * funciona tanto en escritorio como en móvil con el mismo código.
 * El drag se inicia desde la barra de título.
 *
 * Estructura:
 * - Tabs: Buscar y Playlists para navegar el contenido
 * - PlayerPanel siempre visible en la parte inferior —
 *   muestra los controles independientemente del tab activo
 */

import { forwardRef, useState, useCallback, useRef } from "react";
import SearchPanel from "./SearchPanel.jsx";
import PlayerPanel from "./PlayerPanel.jsx";
import PlaylistPanel from "./PlaylistPanel.jsx";
import LyricsPanel from "./LyricsPanel.jsx";
import { PlayerProvider } from "../../context/PlayerProvider.jsx";
import { useSpotifyPlayer } from "../../hooks/useSpotifyPlayer.js";
import "./WMPlayer.scss";

const WMPlayer = forwardRef(function WMPlayer(
  { onClose, isPremium, isVisible },
  ref,
) {
  const [activeTab, setActiveTab] = useState("search");

  // Vista actual — 'tabs' muestra búsqueda/playlists, 'lyrics' muestra la letra.
  // backTab recuerda desde qué tab se abrió la letra para volver al correcto.
  const [view, setView] = useState("tabs");
  const [backTab, setBackTab] = useState("search");

  // Posición del WMP en pantalla — empieza centrado
  const [pos, setPos] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  // Offset entre el punto donde se hace pointerdown y la posición actual
  // del WMP — necesario para que el drag sea relativo al punto de click
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const {
    player,
    deviceId,
    playerState,
    loading: sdkLoading,
    error: sdkError,
  } = useSpotifyPlayer();

  /**
   * Inicia el drag al hacer pointerdown en la barra de título.
   *
   * Capturamos el pointer para seguir recibiendo eventos aunque
   * el puntero salga del elemento — sin esto el drag se interrumpe
   * si el usuario mueve el ratón muy rápido.
   *
   * El offset es la diferencia entre donde hizo click el usuario
   * y la esquina superior izquierda del WMP. Lo usamos en handlePointerMove
   * para que el WMP no salte al mover el ratón.
   */
  const handlePointerDown = useCallback(
    (e) => {
      isDragging.current = true;
      dragOffset.current = {
        x: e.clientX - pos.x,
        y: e.clientY - pos.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [pos],
  );

  /**
   * Actualiza la posición mientras se arrastra.
   * Solo actúa si isDragging es true.
   */
  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    setPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  }, []);

  /**
   * Termina el drag al soltar el pointer.
   */
  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  /**
   * Cambia a la vista de letra guardando desde qué tab venimos.
   * Se llama desde SearchPanel y PlaylistPanel cuando el usuario
   * hace click en una canción.
   */
  function showLyrics() {
    setBackTab(activeTab);
    setView("lyrics");
  }

  /**
   * Vuelve a la vista de tabs desde la letra.
   */
  function hideLyrics() {
    setView("tabs");
  }

  return (
    <PlayerProvider>
      <div
        className={`wmp ${!isVisible ? "wmp--hidden" : ""}`}
        ref={ref}
        style={{
          // Posicionamos el WMP con transform para que {x, y} sea el centro
          left: pos.x,
          top: pos.y,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* ── Barra de título — área de drag ────────────────────────────── */}
        {/* onPointerDown inicia el drag, onPointerMove lo actualiza,
            onPointerUp lo termina. Pointer Events funciona en móvil y desktop */}
        <div
          className="wmp__titlebar"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="wmp__title">
            <span className="wmp__title-text">Windows Media Player</span>
          </div>
          {/* X cierra completamente — desmonta el WMP y lo quita de la taskbar */}
          <button
            className="wmp__close"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
          >
            ✕
          </button>
        </div>

        {/* ── Navegación por tabs — oculta en vista letra ───────────────── */}
        {view === "tabs" && (
          <div className="wmp__tabs">
            <button
              className={`wmp__tab ${activeTab === "search" ? "wmp__tab--active" : ""}`}
              onClick={() => setActiveTab("search")}
            >
              Buscar
            </button>
            <button
              className={`wmp__tab ${activeTab === "playlists" ? "wmp__tab--active" : ""}`}
              onClick={() => setActiveTab("playlists")}
            >
              Playlists
            </button>
          </div>
        )}

        {/* ── Contenido ─────────────────────────────────────────────────── */}
        <div className="wmp__content">
          {/* Vista de letra */}
          {view === "lyrics" && isPremium && (
            <LyricsPanel
              onBack={hideLyrics}
              backLabel={
                backTab === "search" ? "Volver a búsqueda" : "Volver a playlist"
              }
            />
          )}

          {/* Búsqueda — siempre montada */}
          <div
            style={{
              display:
                view === "tabs" && activeTab === "search" ? "block" : "none",
            }}
          >
            <SearchPanel onPlay={showLyrics} />
          </div>

          {/* Playlists — siempre montada, conserva selectedPlaylist al volver */}
          <div
            style={{
              display:
                view === "tabs" && activeTab === "playlists" ? "block" : "none",
            }}
          >
            <PlaylistPanel isPremium={isPremium} onPlay={showLyrics} />
          </div>
        </div>

        {/* ── Player — siempre visible ──────────────────────────────────── */}
        <div className="wmp__player">
          <PlayerPanel
            player={player}
            deviceId={deviceId}
            playerState={playerState}
            sdkLoading={sdkLoading}
            sdkError={sdkError}
          />
        </div>
      </div>
    </PlayerProvider>
  );
});

export default WMPlayer;
