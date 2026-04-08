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
 * Estructura:
 * - Tabs: Buscar y Playlists para navegar el contenido
 * - PlayerPanel siempre visible en la parte inferior —
 *   muestra los controles independientemente del tab activo
 */

import { forwardRef, useState } from "react";
import SearchPanel from "./SearchPanel.jsx";
import PlayerPanel from "./PlayerPanel.jsx";
import PlaylistPanel from "./PlaylistPanel.jsx";
import { PlayerProvider } from "../../context/PlayerProvider.jsx";
import { useSpotifyPlayer } from "../../hooks/useSpotifyPlayer.js";
import "./WMPlayer.scss";

const WMPlayer = forwardRef(function WMPlayer(
  { onClose, isPremium, isVisible },
  ref,
) {
  // Tab activo — solo Buscar y Playlists, Player es siempre visible
  const [activeTab, setActiveTab] = useState("search");

  // El SDK vive aquí — al nivel del WMP, no del PlayerPanel.
  // Así no se desmonta al cambiar de tab.
  // player es necesario para seek (arrastrar la barra de progreso).
  // deviceId es necesario para decirle a Spotify en qué dispositivo reproducir.
  const {
    player,
    deviceId,
    playerState,
    loading: sdkLoading,
    error: sdkError,
  } = useSpotifyPlayer();

  return (
    <PlayerProvider>
      {/* ref expone este nodo DOM a Desktop.jsx para detectar clicks fuera */}
      <div className={`wmp ${!isVisible ? "wmp--hidden" : ""}`} ref={ref}>
        {/* ── Barra de título ───────────────────────────────────────────── */}
        <div className="wmp__titlebar">
          <div className="wmp__title">
            <span className="wmp__title-text">Windows Media Player</span>
          </div>
          {/* X cierra completamente — desmonta el WMP y lo quita de la taskbar */}
          <button className="wmp__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── Navegación por tabs ───────────────────────────────────────── */}
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

        {/* ── Contenido del tab activo ──────────────────────────────────── */}
        <div className="wmp__content">
          {/* Búsqueda — siempre montada para preservar los resultados
      al cambiar de tab y volver */}
          <div style={{ display: activeTab === "search" ? "block" : "none" }}>
            <SearchPanel />
          </div>

          {/* Playlists — siempre montada para no repetir las peticiones */}
          <div
            style={{ display: activeTab === "playlists" ? "block" : "none" }}
          >
            <PlaylistPanel isPremium={isPremium} />
          </div>
        </div>

        {/* ── Player — siempre visible ──────────────────────────────────── */}
        {/* Separado del contenido de tabs para que sea persistente.
            El usuario puede buscar o navegar playlists mientras ve
            qué canción está sonando y controla la reproducción */}
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
