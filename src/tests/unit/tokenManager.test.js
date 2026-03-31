import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveTokens,
  clearTokens,
  getRefreshToken,
  saveCodeVerifier,
  getCodeVerifier,
  clearCodeVerifier,
  isTokenExpired,
  isLoggedIn,
} from "../../auth/tokenManager.js";

/**
 * tokenManager es el núcleo de la autenticación.
 * Gestiona el ciclo de vida completo de los tokens en localStorage:
 * guardar, recuperar, detectar expiración y limpiar.
 *
 * Si algo falla aquí, el usuario verá comportamientos extraños:
 * - Sesiones que no persisten al recargar
 * - Tokens expirados que no se refrescan
 * - Logins que no se pueden completar
 *
 * Usamos beforeEach para limpiar localStorage antes de cada test
 * y garantizar que los tests son independientes entre sí.
 * Sin esto, un test podría contaminar el estado del siguiente.
 */

beforeEach(() => {
  localStorage.clear();
});

// ─── saveTokens ───────────────────────────────────────────────────────────────

describe("saveTokens", () => {
  it("guarda el access token en localStorage", () => {
    // Verificamos que el access token llega correctamente a localStorage.
    // Si falla, el usuario tendrá que hacer login en cada petición
    saveTokens({
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expires_in: 3600,
    });
    expect(localStorage.getItem("sfa_access_token")).toBe("test_access_token");
  });

  it("guarda el refresh token en localStorage", () => {
    // El refresh token es el más importante — permite renovar el access token
    // sin que el usuario tenga que hacer login de nuevo cada hora
    saveTokens({
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expires_in: 3600,
    });
    expect(localStorage.getItem("sfa_refresh_token")).toBe(
      "test_refresh_token",
    );
  });

  it("calcula y guarda la fecha de expiración correctamente", () => {
    // expires_in es en segundos (3600 = 1 hora).
    // Lo convertimos a timestamp absoluto para poder comparar con Date.now().
    // Si el cálculo fuera incorrecto, los tokens se refrescarían demasiado
    // pronto o demasiado tarde
    const before = Date.now();
    saveTokens({
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expires_in: 3600,
    });
    const after = Date.now();

    const expiresAt = Number(localStorage.getItem("sfa_expires_at"));
    // El timestamp debe estar entre antes y después de la llamada + 3600 segundos
    expect(expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
    expect(expiresAt).toBeLessThanOrEqual(after + 3600 * 1000);
  });

  it("no sobreescribe el refresh token si no viene uno nuevo", () => {
    // Spotify no siempre devuelve un nuevo refresh token al renovar.
    // En ese caso debemos conservar el anterior — si lo borramos,
    // el usuario tendrá que hacer login manualmente cada hora
    saveTokens({
      access_token: "token1",
      refresh_token: "refresh_original",
      expires_in: 3600,
    });
    saveTokens({
      access_token: "token2",
      expires_in: 3600,
      // sin refresh_token
    });
    expect(localStorage.getItem("sfa_refresh_token")).toBe("refresh_original");
  });
});

// ─── clearTokens ──────────────────────────────────────────────────────────────

describe("clearTokens", () => {
  it("elimina todos los tokens de localStorage", () => {
    // Al cerrar sesión, no debe quedar ningún rastro de tokens.
    // Si quedara el refresh token, alguien con acceso al navegador
    // podría recuperar la sesión
    saveTokens({
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expires_in: 3600,
    });
    clearTokens();

    expect(localStorage.getItem("sfa_access_token")).toBeNull();
    expect(localStorage.getItem("sfa_refresh_token")).toBeNull();
    expect(localStorage.getItem("sfa_expires_at")).toBeNull();
  });
});

// ─── getRefreshToken ──────────────────────────────────────────────────────────

describe("getRefreshToken", () => {
  it("devuelve el refresh token guardado", () => {
    // Verificamos el ciclo completo: guardar y recuperar.
    // getValidAccessToken depende de esta función para renovar tokens
    saveTokens({
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expires_in: 3600,
    });
    expect(getRefreshToken()).toBe("test_refresh_token");
  });

  it("devuelve null si no hay refresh token", () => {
    // Sin refresh token, getValidAccessToken lanzará un error
    // y el usuario tendrá que hacer login de nuevo.
    // Es importante saber cuándo no hay token en vez de recibir
    // un valor inesperado
    expect(getRefreshToken()).toBeNull();
  });
});

// ─── saveCodeVerifier / getCodeVerifier / clearCodeVerifier ───────────────────

describe("code verifier storage", () => {
  it("guarda y recupera el code verifier", () => {
    // El code verifier se guarda al inicio del login y se recupera
    // en el callback para intercambiarlo por tokens.
    // Si se pierde entre medias, el login falla con "no code verifier found"
    saveCodeVerifier("test_verifier");
    expect(getCodeVerifier()).toBe("test_verifier");
  });

  it("clearCodeVerifier elimina el verifier", () => {
    // El verifier es de un solo uso — una vez canjeado por tokens
    // debe eliminarse para que no pueda reutilizarse
    saveCodeVerifier("test_verifier");
    clearCodeVerifier();
    expect(getCodeVerifier()).toBeNull();
  });
});

// ─── isTokenExpired ───────────────────────────────────────────────────────────

describe("isTokenExpired", () => {
  it("devuelve true si no hay fecha de expiración", () => {
    // Sin fecha de expiración no podemos saber si el token es válido.
    // Es más seguro asumir que ha expirado y pedir uno nuevo
    // que usar un token potencialmente inválido
    expect(isTokenExpired()).toBe(true);
  });

  it("devuelve false si el token no ha expirado", () => {
    // Simulamos un token que expira en 1 hora.
    // isTokenExpired debe devolver false para que se use el token actual
    // y no se haga una petición innecesaria de refresco
    const expiresAt = Date.now() + 3600 * 1000;
    localStorage.setItem("sfa_expires_at", String(expiresAt));
    expect(isTokenExpired()).toBe(false);
  });

  it("devuelve true si el token ha expirado", () => {
    // Simulamos un token que expiró hace 1 hora.
    // isTokenExpired debe detectarlo para que getValidAccessToken
    // solicite un nuevo token antes de hacer la llamada a la API
    const expiresAt = Date.now() - 3600 * 1000;
    localStorage.setItem("sfa_expires_at", String(expiresAt));
    expect(isTokenExpired()).toBe(true);
  });

  it("devuelve true si el token expira en menos de 60 segundos", () => {
    // Tenemos un margen de 60 segundos antes de la expiración real.
    // Esto evita que una llamada a la API falle porque el token expiró
    // justo durante la petición — lo renovamos antes de tiempo
    const expiresAt = Date.now() + 30 * 1000; // expira en 30 segundos
    localStorage.setItem("sfa_expires_at", String(expiresAt));
    expect(isTokenExpired()).toBe(true);
  });
});

// ─── isLoggedIn ───────────────────────────────────────────────────────────────

describe("isLoggedIn", () => {
  it("devuelve false si no hay tokens", () => {
    // Sin tokens el usuario no está autenticado.
    // PrivateRoute usa esta función para decidir si mostrar
    // el contenido o redirigir al login
    expect(isLoggedIn()).toBe(false);
  });

  it("devuelve false si solo hay access token", () => {
    // Con solo el access token no podemos renovar la sesión cuando expire.
    // Consideramos que no está logueado para forzar un login completo
    // y obtener también el refresh token
    localStorage.setItem("sfa_access_token", "test_token");
    expect(isLoggedIn()).toBe(false);
  });

  it("devuelve false si solo hay refresh token", () => {
    // Sin access token no podemos hacer llamadas a la API inmediatamente.
    // Aunque podríamos renovarlo, es más limpio forzar un login completo
    localStorage.setItem("sfa_refresh_token", "test_refresh");
    expect(isLoggedIn()).toBe(false);
  });

  it("devuelve true si hay access token y refresh token", () => {
    // Solo consideramos al usuario logueado si tenemos ambos tokens.
    // El access token para llamadas inmediatas y el refresh token
    // para renovar la sesión cuando expire
    saveTokens({
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expires_in: 3600,
    });
    expect(isLoggedIn()).toBe(true);
  });
});
