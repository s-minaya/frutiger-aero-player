import { describe, it, expect } from "vitest";
import { formatDuration } from "../../api/search.js";

describe("formatDuration", () => {
  it("convierte milisegundos a formato mm:ss", () => {
    expect(formatDuration(238000)).toBe("3:58");
  });

  it("añade cero delante de los segundos menores de 10", () => {
    expect(formatDuration(183000)).toBe("3:03");
  });

  it("maneja canciones de más de 10 minutos", () => {
    expect(formatDuration(654000)).toBe("10:54");
  });

  it("maneja 0 milisegundos", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  it("maneja exactamente 1 minuto", () => {
    expect(formatDuration(60000)).toBe("1:00");
  });
});
