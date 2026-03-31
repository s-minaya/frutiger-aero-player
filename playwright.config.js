import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:5174/spotify-frutiger-aero/",
    headless: true,
  },
  // Vite en dev necesita compilar los módulos en el primer arranque (~6-8s).
  // Aumentamos el timeout de los expect para no fallar en ese primer test.
  expect: { timeout: 15000 },
  // Puerto 5174 dedicado a E2E: siempre arranca un servidor nuevo con MSW activo
  // para no colisionar con el servidor de desarrollo normal (puerto 5173)
  webServer: {
    command: "npm run dev -- --port 5174",
    url: "http://127.0.0.1:5174/spotify-frutiger-aero/",
    reuseExistingServer: false,
    env: { VITE_MSW: "true" },
  },
});
