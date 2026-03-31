import { useEffect, useState, useRef } from "react";
import SearchPanel from "./SearchPanel.jsx";
import PlaylistPanel from "./PlaylistPanel.jsx";
import "./WMPlayer.scss";

export default function WMPlayer({ onClose, isPremium }) {
  const [activeTab, setActiveTab] = useState("search");
  const wmpRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wmpRef.current && !wmpRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="wmp" ref={wmpRef}>
      {/* Barra de título */}
      <div className="wmp__titlebar">
        <div className="wmp__title">
          <span className="wmp__title-text">Windows Media Player</span>
        </div>
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
}
