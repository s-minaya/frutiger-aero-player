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
 * Ciclo de vida controlado por Desktop.jsx:
 * - Se monta cuando playerMounted && playerOpen son true
 * - Click fuera → Desktop llama al handler que pone playerOpen=false
 *   (el componente sigue montado, solo se oculta visualmente)
 * - Click en X → onClose() pone playerMounted=false y playerOpen=false
 *   (el componente se desmonta completamente)
 * - Click en taskbar → toggle de playerOpen (mostrar/ocultar)
 *
 * Tabs:
 * - Buscar → SearchPanel (disponible para todos los usuarios)
 * - Playlists → PlaylistPanel (solo Premium)
 * - Player → próximamente en Fase 5
 */

import { forwardRef, useState } from "react";
import SearchPanel from "./SearchPanel.jsx";
import PlaylistPanel from "./PlaylistPanel.jsx";
import { PlayerProvider } from "../../context/PlayerProvider.jsx";
import "./WMPlayer.scss";
import PlayerPanel from "./PlayerPanel.jsx";

const WMPlayer = forwardRef(function WMPlayer({ onClose, isPremium }, ref) {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <PlayerProvider>
      {/* ref expone este nodo DOM a Desktop.jsx para detectar clicks fuera */}
      <div className="wmp" ref={ref}>
        {/* ── Barra de título ───────────────────────────────────────────── */}
        <div className="wmp__titlebar">
          <div className="wmp__title">
            <span className="wmp__title-text">Windows Media Player</span>
          </div>
          {/* X cierra completamente — desmonta el WMP y lo quita de la taskbar.
            Diferente al click fuera que solo minimiza (oculta sin desmontar) */}
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
          <button
            className={`wmp__tab ${activeTab === "player" ? "wmp__tab--active" : ""}`}
            onClick={() => setActiveTab("player")}
          >
            Player
          </button>
        </div>

        {/* ── Contenido del tab activo ──────────────────────────────────── */}
        <div className="wmp__content">
          {/* Búsqueda — disponible para todos los usuarios */}
          {activeTab === "search" && <SearchPanel />}

          {/* Playlists — isPremium controla si se muestra el contenido
            o el mensaje de "requiere Premium" dentro del componente */}
          {activeTab === "playlists" && <PlaylistPanel isPremium={isPremium} />}

          {/* Player — pendiente de implementar en Fase 5
            Integrará el Web Playback SDK de Spotify */}
          {activeTab === "player" && (
            <div>
              <PlayerPanel />
            </div>
          )}
        </div>
      </div>
    </PlayerProvider>
  );
});

export default WMPlayer;
