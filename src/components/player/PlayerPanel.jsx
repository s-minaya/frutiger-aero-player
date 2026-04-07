import { usePlayer } from "../../hooks/usePlayer.js";
import { useSpotifyPlayer } from "../../hooks/useSpotifyPlayer.js";

export default function PlayerPanel() {
  const { currentTrack, playTrack } = usePlayer();
  const { player, deviceId, loading, error } = useSpotifyPlayer();

  if (loading)
    return <p style={{ color: "white" }}>Conectando con Spotify...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <>
      <div>
        <p>Canción actual: {currentTrack?.name ?? "Ninguna"}</p>
        <button onClick={() => playTrack({ name: "Canción de prueba" })}>
          Simular reproducción
        </button>
      </div>
      <div style={{ color: "white" }}>
        <p>✅ SDK conectado</p>
        <p>Device ID: {deviceId}</p>
        <p>Player: {player ? "listo" : "no disponible"}</p>
      </div>
    </>
  );
}
