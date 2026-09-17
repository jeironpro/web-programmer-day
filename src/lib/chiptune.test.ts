// Tests del chiptune: la persistencia del mute y la forma del schedule de la
// fanfarria (la síntesis real requiere un AudioContext, no se testea aquí).
import { afterEach, describe, expect, it } from "vitest";
import {
  celebrationFanfareSchedule,
  isMuted,
  setMuted,
} from "./chiptune";

afterEach(() => {
  // Limpieza: dejamos la preferencia como estaba (activado por defecto).
  setMuted(false);
});

describe("preferencia de silencio", () => {
  it("por defecto el sonido está activado", () => {
    expect(isMuted()).toBe(false);
  });

  it("setMuted(true) persiste y isMuted lo lee", () => {
    setMuted(true);
    expect(isMuted()).toBe(true);
  });

  it("setMuted(false) vuelve al estado sonoro", () => {
    setMuted(true);
    setMuted(false);
    expect(isMuted()).toBe(false);
  });
});

describe("celebrationFanfareSchedule", () => {
  const events = celebrationFanfareSchedule();

  it("tiene notas en las tres secciones (arpegio, cruzado, final)", () => {
    expect(events.length).toBeGreaterThanOrEqual(20);
  });

  it("todas las notas tienen tiempo y duración positivos", () => {
    for (const ev of events) {
      expect(ev.time).toBeGreaterThanOrEqual(0);
      expect(ev.duration).toBeGreaterThan(0);
    }
  });

  it("termina después de 3 segundos (la fanfarria final)", () => {
    const last = Math.max(...events.map((e) => e.time + e.duration));
    expect(last).toBeGreaterThan(3);
    expect(last).toBeLessThan(4.5);
  });

  it("el arpegio empieza en C4 y sube", () => {
    expect(events[0]?.note).toBe("C4");
    const arpeggio = events.slice(0, 8).map((e) => e.time);
    expect([...arpeggio].sort((a, b) => a - b)).toEqual(arpeggio);
  });
});
