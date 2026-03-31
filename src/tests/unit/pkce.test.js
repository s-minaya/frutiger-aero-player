import { describe, it, expect } from "vitest";
import {
  generateCodeVerifier,
  generateCodeChallenge,
} from "../../auth/pkce.js";

/**
 * PKCE (Proof Key for Code Exchange) es el mecanismo de seguridad
 * que usamos para el login con Spotify sin exponer el Client Secret.
 *
 * El flujo es:
 * 1. Generamos un verifier aleatorio (secreto, solo lo sabe nuestra app)
 * 2. Calculamos el challenge = SHA-256(verifier) (público, se envía a Spotify)
 * 3. Spotify guarda el challenge
 * 4. Nuestra app envía el verifier al final del login
 * 5. Spotify verifica que SHA-256(verifier) == challenge guardado
 *
 * Si cualquiera de estas funciones falla, el login dejará de funcionar
 * con errores crípticos difíciles de depurar
 */

describe("generateCodeVerifier", () => {
  it("genera una cadena no vacía", () => {
    // Si la función falla completamente y devuelve undefined, null o ""
    // toBeTruthy lo detecta — es el primer filtro antes de tests más específicos
    const verifier = generateCodeVerifier();
    expect(verifier).toBeTruthy();
  });

  it("genera una cadena de longitud correcta", () => {
    // El estándar RFC 7636 especifica que el verifier debe tener
    // entre 43 y 128 caracteres. Spotify rechazará el login si no
    // se cumple esta especificación, con un error poco descriptivo
    const verifier = generateCodeVerifier();
    // 64 bytes en base64url = 86 caracteres aprox
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it("solo contiene caracteres base64url válidos", () => {
    // El verifier va en el body de una petición POST.
    // Base64 normal usa +, / y = que son problemáticos en URLs y forms.
    // Base64url los reemplaza por -, _ y elimina el padding =
    // Si base64UrlEncode falla, el login se romperá silenciosamente
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("genera valores distintos cada vez", () => {
    // El verifier es un secreto de seguridad de un solo uso.
    // Si siempre fuera el mismo, un atacante podría predecirlo
    // y completar el login en nombre del usuario (ataque CSRF).
    // Este test verifica que crypto.getRandomValues funciona correctamente
    const v1 = generateCodeVerifier();
    const v2 = generateCodeVerifier();
    expect(v1).not.toBe(v2);
  });
});

describe("generateCodeChallenge", () => {
  it("genera un challenge a partir del verifier", async () => {
    // Test básico — la función no explota y devuelve algo útil.
    // Si crypto.subtle no está disponible en el entorno de test,
    // este test lo detectará inmediatamente
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge).toBeTruthy();
  });

  it("el mismo verifier genera siempre el mismo challenge", async () => {
    // SHA-256 es una función determinista — misma entrada, misma salida.
    // Esto es CRÍTICO: Spotify guarda el challenge al inicio del login
    // y verifica SHA-256(verifier) al final. Si no fuera determinista,
    // el login nunca funcionaría
    const verifier = generateCodeVerifier();
    const c1 = await generateCodeChallenge(verifier);
    const c2 = await generateCodeChallenge(verifier);
    expect(c1).toBe(c2);
  });

  it("solo contiene caracteres base64url válidos", async () => {
    // Aunque tiene el mismo nombre que el test del verifier,
    // testea una función DISTINTA — generateCodeChallenge.
    // El challenge también va en una URL (parámetro code_challenge).
    // El verifier y el challenge siguen caminos de código diferentes:
    // verifier: bytes → base64UrlEncode
    // challenge: bytes → SHA-256 → nuevos bytes → base64UrlEncode
    // Uno podría funcionar y el otro no, por eso se testean por separado
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("verifiers distintos generan challenges distintos", async () => {
    // Verifica que SHA-256 está funcionando correctamente —
    // entradas distintas deben producir salidas distintas.
    // Si dos verifiers generaran el mismo challenge, cualquier
    // usuario podría completar el login de otro usuario
    const c1 = await generateCodeChallenge(generateCodeVerifier());
    const c2 = await generateCodeChallenge(generateCodeVerifier());
    expect(c1).not.toBe(c2);
  });
});
