import { describe, it, expect } from "vitest";
import { formatDuration } from "../../api/search.js";

/**
 * formatDuration convierte milisegundos a formato mm:ss
 * Es importante que sea exacta porque se muestra al usuario
 * y un error aquí sería inmediatamente visible
 */
describe("formatDuration", () => {
  it("convierte milisegundos a formato mm:ss", () => {
    // Caso normal — una canción de 3 minutos y 58 segundos
    // 238000ms = 3 * 60000 + 58 * 1000
    expect(formatDuration(238000)).toBe("3:58");
  });

  it("añade cero delante de los segundos menores de 10", () => {
    // Sin el padStart(2, '0') saldría '3:3' en vez de '3:03'
    // lo cual sería confuso e incorrecto visualmente
    expect(formatDuration(183000)).toBe("3:03");
  });

  it("maneja canciones de más de 10 minutos", () => {
    // Verificamos que los minutos no tienen límite artificial
    // y que el cálculo es correcto para valores grandes
    expect(formatDuration(654000)).toBe("10:54");
  });

  it("maneja 0 milisegundos", () => {
    // Caso límite — si la API devuelve duration_ms: 0
    // la función no debe explotar ni devolver NaN:NaN
    expect(formatDuration(0)).toBe("0:00");
  });

  it("maneja exactamente 1 minuto", () => {
    // Verifica que el módulo % funciona bien en el límite exacto
    // 60000ms debería dar '1:00', no '0:60'
    expect(formatDuration(60000)).toBe("1:00");
  });
});
