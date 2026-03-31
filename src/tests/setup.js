import "@testing-library/jest-dom";
import { beforeAll, afterAll, afterEach } from "vitest";
import { server } from "./mocks/server.js";

/**
 * Configuración global de tests.
 *
 * beforeAll — inicia el servidor MSW antes de todos los tests
 * afterEach — resetea los handlers después de cada test
 *             para que los overrides de un test no afecten al siguiente
 * afterAll  — para el servidor al terminar todos los tests
 */
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
