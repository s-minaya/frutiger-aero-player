import { http, HttpResponse } from "msw";

/**
 * Handlers de MSW — definen qué respuesta devuelve cada endpoint.
 *
 * MSW intercepta las peticiones HTTP reales antes de que lleguen
 * a la red y devuelve estas respuestas controladas.
 *
 * Ventaja sobre vi.mock: probamos toda la cadena real
 * (componente → hook → spotifyFetch → fetch) en vez de
 * saltarnos parte de ella
 */

// ─── Datos de prueba ──────────────────────────────────────────────────────────

export const mockUser = {
  id: "test_user_id",
  display_name: "Usuario Test",
  email: "test@example.com",
  product: "premium",
  images: [{ url: "https://example.com/avatar.jpg" }],
};

export const mockUserFree = {
  ...mockUser,
  product: "free",
};

export const mockTracks = [
  {
    id: "1",
    name: "Creep",
    duration_ms: 238000,
    preview_url: "https://example.com/preview1.mp3",
    artists: [{ name: "Radiohead" }],
    album: {
      name: "Pablo Honey",
      images: [
        { url: "https://example.com/large.jpg" },
        { url: "https://example.com/medium.jpg" },
        { url: "https://example.com/small.jpg" },
      ],
    },
  },
  {
    id: "2",
    name: "Karma Police",
    duration_ms: 264000,
    preview_url: "https://example.com/preview2.mp3",
    artists: [{ name: "Radiohead" }],
    album: {
      name: "OK Computer",
      images: [
        { url: "https://example.com/large.jpg" },
        { url: "https://example.com/medium.jpg" },
        { url: "https://example.com/small.jpg" },
      ],
    },
  },
];

export const mockPlaylists = [
  {
    id: "playlist_1",
    name: "Mi playlist favorita",
    images: [{ url: "https://example.com/playlist1.jpg" }],
    tracks: { total: 15 },
  },
  {
    id: "playlist_2",
    name: "Rock clásico",
    images: [{ url: "https://example.com/playlist2.jpg" }],
    tracks: { total: 30 },
  },
];

export const mockPlaylistTracks = [
  {
    added_at: "2025-04-02T13:23:24Z",
    item: mockTracks[0],
  },
  {
    added_at: "2025-04-02T13:23:32Z",
    item: mockTracks[1],
  },
];

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const handlers = [
  // Perfil del usuario
  // Usado por useAuth para cargar los datos del usuario
  // y detectar si tiene Premium
  http.get("https://api.spotify.com/v1/me", () => {
    return HttpResponse.json(mockUser);
  }),

  // Búsqueda de canciones
  // Usado por searchTracks en api/search.js
  http.get("https://api.spotify.com/v1/search", () => {
    return HttpResponse.json({
      tracks: {
        items: mockTracks,
      },
    });
  }),

  // Playlists del usuario
  // Usado por getUserPlaylists en api/playlists.js
  http.get("https://api.spotify.com/v1/me/playlists", () => {
    return HttpResponse.json({
      items: mockPlaylists,
      next: null, // sin paginación en tests
    });
  }),

  // Canciones de una playlist
  // Usado por getPlaylistTracks en api/playlists.js
  // :playlistId captura el ID dinámico de la URL
  http.get("https://api.spotify.com/v1/playlists/:playlistId/items", () => {
    return HttpResponse.json({
      items: mockPlaylistTracks,
    });
  }),
];
