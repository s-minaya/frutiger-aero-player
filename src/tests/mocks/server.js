import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

/**
 * Servidor MSW para Node — usado en tests de Vitest.
 *
 * En el navegador MSW usa un Service Worker para interceptar peticiones.
 * En Node (donde corre Vitest) no hay Service Worker, así que MSW
 * usa un servidor HTTP interno que intercepta las peticiones de fetch.
 *
 * setupServer crea ese servidor con los handlers que definimos.
 * Lo exportamos para poder iniciarlo y pararlo en cada test.
 */
export const server = setupServer(...handlers);
