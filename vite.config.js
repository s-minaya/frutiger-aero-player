import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/spotify-frutiger-aero/",
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setup.js",
    globals: true,
    // Los tests E2E son de Playwright, no de Vitest — excluirlos evita
    // el error "Playwright Test did not expect test.describe() to be called here"
    exclude: ["**/node_modules/**", "**/tests/e2e/**"],
  },
});
