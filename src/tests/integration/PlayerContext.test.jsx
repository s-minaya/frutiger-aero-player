import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlayerProvider } from "../../context/PlayerProvider.jsx";
import { usePlayer } from "../../hooks/usePlayer.js";

/**
 * Tests del PlayerContext y PlayerProvider.
 *
 * Vamos a verificar que el estado se actualiza correctamente
 * cuando se llaman las funciones.
 */

// Componente auxiliar que consume el contexto y expone
// su estado en el DOM para que los tests puedan verificarlo
const mockQueue = [
  { id: "1", name: "Creep" },
  { id: "2", name: "Karma Police" },
  { id: "3", name: "Bohemian Rhapsody" },
];

function TestConsumer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    playTrack,
    togglePlay,
    setVolume,
    nextTrack,
    previousTrack,
  } = usePlayer();

  return (
    <div>
      <p>Canción: {currentTrack?.name ?? "ninguna"}</p>
      <p>Reproduciendo: {isPlaying ? "sí" : "no"}</p>
      <p>Volumen: {volume}</p>
      <button onClick={() => playTrack(mockQueue[0], mockQueue)}>Play</button>
      <button onClick={() => playTrack(mockQueue[1], mockQueue)}>
        Play segunda
      </button>
      <button onClick={togglePlay}>Toggle</button>
      <button onClick={() => setVolume(0.5)}>Volumen 50%</button>
      <button onClick={nextTrack}>Siguiente</button>
      <button onClick={previousTrack}>Anterior</button>
    </div>
  );
}

describe("PlayerContext", () => {
  it("estado inicial es correcto", () => {
    // Sin ninguna interacción el estado debe ser:
    // sin canción, sin reproducir, volumen al 80%
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    expect(screen.getByText("Canción: ninguna")).toBeInTheDocument();
    expect(screen.getByText("Reproduciendo: no")).toBeInTheDocument();
    expect(screen.getByText("Volumen: 0.8")).toBeInTheDocument();
  });

  it("playTrack actualiza la canción y activa la reproducción", () => {
    // Al llamar a playTrack debe cambiar currentTrack
    // y poner isPlaying a true simultáneamente
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    fireEvent.click(screen.getByText("Play"));

    expect(screen.getByText("Canción: Creep")).toBeInTheDocument();
    expect(screen.getByText("Reproduciendo: sí")).toBeInTheDocument();
  });

  it("togglePlay alterna entre play y pause", () => {
    // Primero reproducimos una canción, luego alternamos
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    fireEvent.click(screen.getByText("Play"));
    expect(screen.getByText("Reproduciendo: sí")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByText("Reproduciendo: no")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByText("Reproduciendo: sí")).toBeInTheDocument();
  });

  it("togglePlay no hace nada si no hay canción", () => {
    // Sin canción seleccionada togglePlay no debe cambiar isPlaying
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByText("Reproduciendo: no")).toBeInTheDocument();
  });

  it("setVolume actualiza el volumen", () => {
    // El volumen debe actualizarse correctamente
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    fireEvent.click(screen.getByText("Volumen 50%"));
    expect(screen.getByText("Volumen: 0.5")).toBeInTheDocument();
  });

  it("usePlayer lanza error fuera del Provider", () => {
    // Si alguien usa usePlayer fuera del PlayerProvider
    // debe recibir un error descriptivo
    expect(() => {
      render(<TestConsumer />);
    }).toThrow("usePlayer debe usarse dentro de un PlayerProvider");
  });
  it("playTrack guarda la queue y el índice correcto", () => {
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    // Simulamos click en la segunda canción de una lista de tres
    // El índice debe ser 1, no 0
    fireEvent.click(screen.getByText("Play segunda"));

    expect(screen.getByText("Canción: Karma Police")).toBeInTheDocument();
  });

  it("nextTrack avanza a la siguiente canción de la queue", () => {
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    fireEvent.click(screen.getByText("Play"));
    expect(screen.getByText("Canción: Creep")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Siguiente"));
    expect(screen.getByText("Canción: Karma Police")).toBeInTheDocument();
  });

  it("previousTrack retrocede a la canción anterior", () => {
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    fireEvent.click(screen.getByText("Play"));
    fireEvent.click(screen.getByText("Siguiente"));
    expect(screen.getByText("Canción: Karma Police")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Anterior"));
    expect(screen.getByText("Canción: Creep")).toBeInTheDocument();
  });

  it("nextTrack no hace nada en la última canción", () => {
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    fireEvent.click(screen.getByText("Play"));
    fireEvent.click(screen.getByText("Siguiente")); // → Karma Police
    fireEvent.click(screen.getByText("Siguiente")); // → última canción
    fireEvent.click(screen.getByText("Siguiente")); // → no hace nada

    expect(screen.getByText("Canción: Bohemian Rhapsody")).toBeInTheDocument();
  });

  it("previousTrack no hace nada en la primera canción", () => {
    render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>,
    );

    fireEvent.click(screen.getByText("Play"));
    fireEvent.click(screen.getByText("Anterior")); // → no hace nada

    expect(screen.getByText("Canción: Creep")).toBeInTheDocument();
  });
});
