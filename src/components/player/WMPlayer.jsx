import { forwardRef, useState } from "react";
import SearchPanel from "./SearchPanel.jsx";
import PlaylistPanel from "./PlaylistPanel.jsx";
import "./WMPlayer.scss";

// forwardRef permite que Desktop apunte al nodo DOM del WMP
// para detectar clicks fuera desde el padre, que es quien tiene el estado.
const WMPlayer = forwardRef(function WMPlayer({ onClose, isPremium }, ref) {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <div className="wmp" ref={ref}>
      {/* Barra de título */}
      <div className="wmp__titlebar">
        <div className="wmp__title">
          <span className="wmp__title-text">Windows Media Player</span>
        </div>
        {/* La X cierra completamente — desmonta el componente */}
        <button className="wmp__close" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Tabs */}
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

      {/* Contenido */}
      <div className="wmp__content">
        {activeTab === "search" && <SearchPanel />}
        {activeTab === "playlists" && <PlaylistPanel isPremium={isPremium} />}
        {activeTab === "player" && <div>Player — próximamente</div>}
      </div>
    </div>
  );
});

export default WMPlayer;
