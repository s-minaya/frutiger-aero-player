import { test, expect } from "@playwright/test";

/**
 * Tests E2E del flujo de autenticación.
 *
 * Playwright lanza un navegador real y prueba la app completa.
 * MSW intercepta las llamadas a Spotify en el navegador,
 * así que no necesitamos credenciales reales.
 *
 * Para simular una sesión activa inyectamos tokens falsos
 * en localStorage antes de navegar — igual que haría
 * el flujo real de login.
 *
 * addInitScript se ejecuta antes de que cargue cualquier
 * JS de la app, así que los tokens están listos cuando
 * useAuth los busca por primera vez
 */

const FAKE_TOKENS = {
  sfa_access_token: "fake_access_token",
  sfa_refresh_token: "fake_refresh_token",
  sfa_expires_at: String(Date.now() + 3600 * 1000),
};

test.describe("Pantalla de login", () => {
  test("muestra la pantalla de login cuando no hay sesión", async ({
    page,
  }) => {
    // Sin tokens, PrivateRoute redirige a /login.
    // Verificamos que LoginScreen se renderiza correctamente
    await page.goto("./");

    await expect(
      page.getByText(/Para comenzar, haz clic en tu usuario/i),
    ).toBeVisible();
  });

  test("redirige a /login si se accede a / sin sesión", async ({ page }) => {
    // PrivateRoute comprueba isLoggedIn() al montar.
    // Si no hay tokens debe redirigir inmediatamente
    await page.goto("./");

    await expect(page).toHaveURL(/\/login/);
  });

  test("muestra el botón de apagar equipo", async ({ page }) => {
    // El botón debe ser visible en el pie de la pantalla.
    // Verificamos en E2E porque depende del CSS real del navegador
    await page.goto("login");

    await expect(page.getByText(/Apagar el equipo/i)).toBeVisible();
  });

  test("muestra el usuario por defecto", async ({ page }) => {
    // Antes del login siempre mostramos "Usuario" como placeholder
    await page.goto("login");

    await expect(page.getByText("Usuario", { exact: true })).toBeVisible();
  });
});

test.describe("Desktop con sesión activa", () => {
  test.beforeEach(async ({ page }) => {
    // Inyectamos tokens falsos antes de cada test.
    // MSW interceptará las llamadas a /me y devolverá mockUser,
    // así useAuth cargará el perfil correctamente
    await page.addInitScript((tokens) => {
      for (const [key, value] of Object.entries(tokens)) {
        localStorage.setItem(key, value);
      }
    }, FAKE_TOKENS);
  });

  test("muestra el escritorio con los iconos decorativos", async ({ page }) => {
    // Con sesión activa la app debe mostrar el Desktop.
    // Los iconos decorativos confirman que el componente
    // se montó y renderizó completamente
    await page.goto("./");

    await expect(page.getByText("Buscaminas")).toBeVisible();
    await expect(page.getByText("Paint")).toBeVisible();
    await expect(page.getByText("Messenger")).toBeVisible();
  });

  test("muestra la taskbar con el botón inicio", async ({ page }) => {
    // La taskbar es la base de navegación del Desktop.
    // Si no aparece, el usuario no puede acceder a nada
    await page.goto("./");

    await expect(page.getByText("Inicio")).toBeVisible();
  });

  test("muestra el reloj en la taskbar", async ({ page }) => {
    // El reloj es parte del sistema tray.
    // Verificamos que tiene formato HH:MM con dos puntos
    await page.goto("./");

    await expect(page.locator(".system-tray__time")).toHaveText(/\d{2}:\d{2}/);
  });

  test("abre el menú inicio al pulsar el botón", async ({ page }) => {
    // El menú inicio es el punto de acceso al reproductor.
    // Verificamos que el click funciona y el menú es visible
    await page.goto("./");

    await page.getByText("Inicio").click();

    await expect(page.getByText("Reproductor de Windows")).toBeVisible();
  });

  test("cierra el menú inicio al hacer click fuera", async ({ page }) => {
    // El menú debe cerrarse al hacer click fuera.
    // Sin esto bloquearía el acceso a los iconos del escritorio
    await page.goto("./");

    await page.getByText("Inicio").click();
    await expect(page.getByText("Reproductor de Windows")).toBeVisible();

    await page.mouse.click(700, 300);

    await expect(page.getByText("Reproductor de Windows")).not.toBeVisible();
  });

  test("abre el WMP al hacer doble click en el icono", async ({ page }) => {
    // El icono de WMP en el escritorio debe abrir el reproductor
    // al hacer doble click — comportamiento estándar de XP
    await page.goto("./");

    await page.getByText("Windows Media Player").dblclick();

    await expect(page.locator(".wmp")).toBeVisible();
  });

  test("cierra el WMP al pulsar el botón X", async ({ page }) => {
    // El botón cerrar debe desmontar el componente WMP.
    // Si no funciona el usuario queda atrapado en el reproductor
    await page.goto("./");

    await page.getByText("Windows Media Player").dblclick();
    await expect(page.locator(".wmp")).toBeVisible();

    await page.locator(".wmp__close").click();

    await expect(page.locator(".wmp")).not.toBeVisible();
  });
});
