import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchPanel from "../../components/player/SearchPanel.jsx";
import { PlayerProvider } from "../../context/PlayerProvider.jsx";
import { server } from "../mocks/server.js";
import { http, HttpResponse } from "msw";

/**
 * Tests de integración de SearchPanel con MSW.
 *
 * Ahora probamos la cadena completa:
 * SearchPanel → useSearch → searchTracks → spotifyFetch → fetch → MSW
 *
 * MSW intercepta el fetch real y devuelve datos controlados.
 * Esto nos da más confianza que mockear el hook directamente,
 * porque probamos que toda la cadena funciona junta.
 *
 * Para que spotifyFetch no falle por falta de token,
 * ponemos un token falso en localStorage antes de cada test.
 */

beforeEach(() => {
  // spotifyFetch necesita un token para añadir el header Authorization.
  // Sin esto getValidAccessToken lanza un error antes de llegar a MSW
  localStorage.setItem("sfa_access_token", "fake_token");
  localStorage.setItem("sfa_expires_at", String(Date.now() + 3600 * 1000));
});

afterEach(() => {
  localStorage.clear();
});

describe("SearchPanel", () => {
  it("muestra el input de búsqueda en el estado inicial", () => {
    // El input es el punto de entrada principal.
    // Sin él el usuario no puede buscar nada
    render(
      <PlayerProvider>
        <SearchPanel />
      </PlayerProvider>,
    );

    expect(
      screen.getByPlaceholderText(/Buscar canciones/i),
    ).toBeInTheDocument();
  });

  it("no muestra mensajes de estado en el estado inicial", () => {
    // Con query vacía no debe haber mensajes.
    // "No se encontraron resultados" sin haber buscado nada
    // sería confuso para el usuario
    render(
      <PlayerProvider>
        <SearchPanel />
      </PlayerProvider>,
    );

    expect(
      screen.queryByText(/No se encontraron resultados/i),
    ).not.toBeInTheDocument();
  });

  it("muestra resultados al escribir en el input", async () => {
    // Probamos la cadena completa — el usuario escribe,
    // useSearch hace la petición, MSW la intercepta,
    // y los resultados aparecen en pantalla.
    // waitFor espera a que el estado asíncrono se resuelva
    render(
      <PlayerProvider>
        <SearchPanel />
      </PlayerProvider>,
    );

    const input = screen.getByPlaceholderText(/Buscar canciones/i);
    fireEvent.change(input, { target: { value: "radiohead" } });

    await waitFor(
      () => {
        expect(screen.getByText("Creep")).toBeInTheDocument();
        expect(screen.getByText("Karma Police")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("muestra el artista de cada canción", async () => {
    // El artista es tan importante como el título para identificar
    // una canción — verificamos que también se renderiza
    render(
      <PlayerProvider>
        <SearchPanel />
      </PlayerProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Buscar canciones/i), {
      target: { value: "radiohead" },
    });

    await waitFor(
      () => {
        expect(screen.getAllByText("Radiohead")).toHaveLength(2);
      },
      { timeout: 1000 },
    );
  });

  it("muestra mensaje cuando la API no devuelve resultados", async () => {
    // Sobreescribimos el handler por defecto para simular
    // una búsqueda sin resultados.
    // server.use añade un handler temporal que tiene prioridad
    // sobre los handlers globales solo en este test
    server.use(
      http.get("https://api.spotify.com/v1/search", () => {
        return HttpResponse.json({ tracks: { items: [] } });
      }),
    );

    render(
      <PlayerProvider>
        <SearchPanel />
      </PlayerProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Buscar canciones/i), {
      target: { value: "xkzjqwerty12345" },
    });

    await waitFor(
      () => {
        expect(
          screen.getByText(/No se encontraron resultados/i),
        ).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("muestra error si la API devuelve 429", async () => {
    // spotifyFetch reintenta 3 veces con exponential backoff.
    // Con Retry-After: 0 el backoff calculado es:
    // retryAfter * 1000 * Math.pow(2, attempt) = 0 * 1000 * 2^n = 0ms
    // así los 4 fetches (3 reintentos + fallo final) ocurren
    // casi instantáneamente y no necesitamos fake timers
    server.use(
      http.get("https://api.spotify.com/v1/search", () => {
        return HttpResponse.json(
          { error: { status: 429, message: "Too many requests" } },
          { status: 429, headers: { "Retry-After": "0" } },
        );
      }),
    );

    render(
      <PlayerProvider>
        <SearchPanel />
      </PlayerProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Buscar canciones/i), {
      target: { value: "radiohead" },
    });

    await waitFor(
      () => {
        expect(screen.getByText(/Too many requests/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
  it("llama a playTrack al hacer click en una canción", async () => {
    // Verificamos que al hacer click en un resultado
    // se intenta reproducir la canción via el contexto
    render(
      <PlayerProvider>
        <SearchPanel />
      </PlayerProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Buscar canciones/i), {
      target: { value: "radiohead" },
    });

    await waitFor(
      () => {
        expect(screen.getByText("Creep")).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    fireEvent.click(screen.getByText("Creep"));

    // No podemos verificar que el SDK reproduce — está mockeado —
    // pero sí que el click no lanza errores y el elemento sigue visible
    expect(screen.getByText("Creep")).toBeInTheDocument();
  });
});
