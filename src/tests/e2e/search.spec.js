import { test, expect } from "@playwright/test";

/**
 * Tests E2E de la búsqueda de canciones.
 *
 * Probamos el flujo completo desde el punto de vista del usuario:
 * abrir el WMP, ir al tab de búsqueda, escribir y ver resultados.
 *
 * MSW devuelve mockTracks para cualquier búsqueda,
 * así que siempre veremos Creep y Karma Police como resultados.
 */

const FAKE_TOKENS = {
  sfa_access_token: "fake_access_token",
  sfa_refresh_token: "fake_refresh_token",
  sfa_expires_at: String(Date.now() + 3600 * 1000),
};

test.describe("Búsqueda de canciones", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((tokens) => {
      for (const [key, value] of Object.entries(tokens)) {
        localStorage.setItem(key, value);
      }
    }, FAKE_TOKENS);

    // Abrimos el WMP antes de cada test — es el punto de entrada
    await page.goto("./");
    await page.getByText("Windows Media Player").dblclick();
    await expect(page.locator(".wmp")).toBeVisible();
  });

  test("muestra el input de búsqueda en el tab Buscar", async ({ page }) => {
    // El tab Buscar debe estar activo por defecto
    // y mostrar el input inmediatamente
    await expect(page.getByPlaceholder(/Buscar canciones/i)).toBeVisible();
  });

  test("muestra resultados al escribir una búsqueda", async ({ page }) => {
    // MSW devuelve mockTracks para cualquier query.
    // Verificamos que el flujo completo funciona en el navegador real
    await page.getByPlaceholder(/Buscar canciones/i).fill("radiohead");

    await expect(page.getByText("Creep")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("Karma Police")).toBeVisible({ timeout: 2000 });
  });

  test("muestra el artista junto a cada canción", async ({ page }) => {
    // El artista ayuda al usuario a identificar la canción correcta
    await page.getByPlaceholder(/Buscar canciones/i).fill("radiohead");

    await expect(page.locator(".search-panel__artist").first()).toHaveText(
      "Radiohead",
      { timeout: 2000 },
    );
  });

  test("cambia al tab Playlists al hacer click", async ({ page }) => {
    // La navegación entre tabs debe funcionar correctamente
    await page.getByText("Playlists").click();

    // El input de búsqueda ya no debe estar visible
    await expect(page.getByPlaceholder(/Buscar canciones/i)).not.toBeVisible();
  });
});
