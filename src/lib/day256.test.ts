// Tests de la lógica del día 256: bisiestos, límites de año, rollover de
// medianoche y overrides por query param. Las fechas se crean siempre en
// hora local (mismo convenio que usa src/lib/day256.ts).
import { describe, expect, it } from "vitest";
import {
  DAY_NUMBER,
  day256StartOfYear,
  dayOfYear,
  daysInYear,
  isDay256,
  isLeapYear,
  nextDay256Start,
  readDateOverride,
} from "./day256";

/** Atajo para construir fechas locales legibles: ymd(2026, 9, 17, 10, 30). */
function ymd(y: number, m: number, d: number, h = 0, min = 0): Date {
  return new Date(y, m - 1, d, h, min);
}

describe("isLeapYear", () => {
  it("detecta años bisiestos divisibles por 4", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2028)).toBe(true);
  });

  it("rechaza años de siglo no divisibles por 400", () => {
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2100)).toBe(false);
  });

  it("acepta años de siglo divisibles por 400", () => {
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2400)).toBe(true);
  });

  it("rechaza años comunes", () => {
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2025)).toBe(false);
  });
});

describe("dayOfYear", () => {
  it("devuelve 1 el 1 de enero", () => {
    expect(dayOfYear(ymd(2026, 1, 1))).toBe(1);
  });

  it("cuenta correctamente a mitad de año", () => {
    // 2026 no bisiesto: 31+28+31+30+31 = 151 días hasta mayo, +17 = 168
    expect(dayOfYear(ymd(2026, 6, 17))).toBe(168);
  });

  it("llega a 256 el 13 de septiembre en años comunes", () => {
    expect(dayOfYear(ymd(2026, 9, 13))).toBe(256);
  });

  it("llega a 256 el 12 de septiembre en años bisiestos", () => {
    expect(dayOfYear(ymd(2024, 9, 12))).toBe(256);
  });

  it("devuelve 366 el 31 de diciembre de un bisiesto", () => {
    expect(dayOfYear(ymd(2024, 12, 31))).toBe(366);
  });
});

describe("daysInYear", () => {
  it("devuelve 365 en años comunes y 366 en bisiestos", () => {
    expect(daysInYear(2026)).toBe(365);
    expect(daysInYear(2024)).toBe(366);
  });
});

describe("day256StartOfYear", () => {
  it("cae el 13 de septiembre en años comunes", () => {
    const d = day256StartOfYear(2026);
    expect([d.getMonth() + 1, d.getDate()]).toEqual([9, 13]);
  });

  it("cae el 12 de septiembre en años bisiestos", () => {
    const d = day256StartOfYear(2024);
    expect([d.getMonth() + 1, d.getDate()]).toEqual([9, 12]);
  });

  it("es medianoche local", () => {
    const d = day256StartOfYear(2027);
    expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([0, 0, 0]);
  });
});

describe("isDay256", () => {
  it("es true durante todo el día 256 (común)", () => {
    expect(isDay256(ymd(2026, 9, 13, 0, 0))).toBe(true);
    expect(isDay256(ymd(2026, 9, 13, 12, 0))).toBe(true);
    expect(isDay256(ymd(2026, 9, 13, 23, 59))).toBe(true);
  });

  it("es true durante todo el día 256 (bisiesto)", () => {
    expect(isDay256(ymd(2024, 9, 12, 15, 30))).toBe(true);
  });

  it("es false los días vecinos", () => {
    expect(isDay256(ymd(2026, 9, 12))).toBe(false);
    expect(isDay256(ymd(2026, 9, 14))).toBe(false);
  });
});

describe("nextDay256Start", () => {
  it("devuelve el día 256 de este año si aún no ha llegado", () => {
    const next = nextDay256Start(ymd(2026, 9, 13));
    expect([next.getFullYear(), next.getMonth() + 1, next.getDate()]).toEqual([2026, 9, 13]);
  });

  it("devuelve el día 256 de este año durante la propia celebración", () => {
    const next = nextDay256Start(ymd(2026, 9, 13, 20, 0));
    expect([next.getFullYear(), next.getMonth() + 1, next.getDate()]).toEqual([2026, 9, 13]);
  });

  it("pasa al año siguiente tras las 24:00 del día 256", () => {
    const next = nextDay256Start(ymd(2026, 9, 14, 0, 0));
    // 2027 no es bisiesto -> 13 de septiembre
    expect([next.getFullYear(), next.getMonth() + 1, next.getDate()]).toEqual([2027, 9, 13]);
  });

  it("tras el día 256 de un bisiesto apunta al 13-sep del año común siguiente", () => {
    const next = nextDay256Start(ymd(2024, 12, 31));
    expect([next.getFullYear(), next.getMonth() + 1, next.getDate()]).toEqual([2025, 9, 13]);
  });

  it("el 1 de enero apunta al día 256 del mismo año", () => {
    const next = nextDay256Start(ymd(2027, 1, 1, 0, 0));
    expect([next.getFullYear(), next.getMonth() + 1, next.getDate()]).toEqual([2027, 9, 13]);
  });
});

describe("readDateOverride", () => {
  it("devuelve null cuando no hay parámetros", () => {
    expect(readDateOverride("")).toBeNull();
    expect(readDateOverride("?otro=valor")).toBeNull();
  });

  it("parsea ?date completo", () => {
    const d = readDateOverride("?date=2026-09-13T18:30:45");
    expect(d).not.toBeNull();
    expect([d!.getFullYear(), d!.getMonth() + 1, d!.getDate(), d!.getHours(), d!.getMinutes()]).toEqual([
      2026, 9, 13, 18, 30,
    ]);
  });

  it("parsea ?date solo con fecha", () => {
    const d = readDateOverride("?date=2026-09-13");
    expect(d).not.toBeNull();
    expect([d!.getHours(), d!.getMinutes()]).toEqual([0, 0]);
  });

  it("rechaza fechas imposibles", () => {
    expect(readDateOverride("?date=2026-02-30")).toBeNull();
    expect(readDateOverride("?date=nope")).toBeNull();
  });

  it("parsea ?day=256 con año por defecto", () => {
    const d = readDateOverride("?day=256");
    expect(d).not.toBeNull();
    expect(dayOfYear(d!)).toBe(256);
  });

  it("parsea ?day con ?year bisiesto", () => {
    const d = readDateOverride("?day=256&year=2024");
    expect(d).not.toBeNull();
    expect([d!.getFullYear(), d!.getMonth() + 1, d!.getDate()]).toEqual([2024, 9, 12]);
  });

  it("rechaza días fuera de rango", () => {
    expect(readDateOverride("?day=0")).toBeNull();
    expect(readDateOverride("?day=367")).toBeNull();
    expect(readDateOverride("?day=366&year=2026")).toBeNull();
    expect(readDateOverride("?day=256&year=abc")).toBeNull();
  });

  it("usa DAY_NUMBER como referencia", () => {
    expect(DAY_NUMBER).toBe(256);
  });
});
