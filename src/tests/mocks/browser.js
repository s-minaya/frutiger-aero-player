import { setupWorker } from "msw/browser";
import { handlers } from "./handlers.js";

/**
 * Worker de MSW para el navegador.
 *
 * En tests unitarios e integración usamos setupServer (Node).
 * En E2E la app corre en un navegador real, así que necesitamos
 * el Service Worker que intercepta peticiones a nivel de red.
 *
 * Este worker solo se activa en modo test para no interferir
 * con las llamadas reales a Spotify en desarrollo normal
 */
export const worker = setupWorker(...handlers);
