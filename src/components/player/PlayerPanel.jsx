import { usePlayer } from "../../hooks/usePlayer.js";

export default function PlayerPanel() {
  const { currentTrack, playTrack } = usePlayer();

  return (
    <div>
      <p>Canción actual: {currentTrack?.name ?? "Ninguna"}</p>
      <button onClick={() => playTrack({ name: "Canción de prueba" })}>
        Simular reproducción
      </button>
    </div>
  );
}
