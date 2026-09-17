// Chiptune con WebAudio puro: sin ficheros de audio, todo se sintetiza con
// osciladores square/triangle y envolventes cortas (estética 8-bit).
//
// AudioContext: los navegadores exigen un gesto del usuario para arrancar el
// audio. Lo creamos de forma diferida (lazy) y lo reanudamos al reproducir; si
// el usuario nunca ha interactuado, la fanfarria simplemente no suena.

/** Nota con nombre -> frecuencia (Hz). Octava 4 = la central del piano. */
const NOTE_FREQUENCIES: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, E6: 1318.5, G6: 1568.0,
};

export type NoteName = keyof typeof NOTE_FREQUENCIES;

/** Un evento de nota: nombre, instante (s) y duración (s). */
export interface NoteEvent {
  note: NoteName | null; // null = silencio
  time: number;
  duration: number;
}

// ── Preferencia de silencio (persistida) ────────────────────────────────────
const MUTE_KEY = "programmer-day.muted";

/** Fallback en memoria cuando localStorage no está disponible (tests, SSR,
 * navegadores con storage bloqueado): la preferencia vive en la sesión. */
let memoryMuted: boolean | null = null;

/** Devuelve localStorage si es utilizable, o null si no. */
function safeStorage(): Storage | null {
  try {
    const store = globalThis.localStorage;
    // Sondamos con una operación real: algunos contextos exponen el objeto
    // pero lanzan al usarlo (modo privado).
    store?.getItem(MUTE_KEY);
    return store ?? null;
  } catch {
    return null;
  }
}

/** Lee la preferencia de silencio (por defecto: sonido activado). */
export function isMuted(): boolean {
  const store = safeStorage();
  if (store) return store.getItem(MUTE_KEY) === "1";
  return memoryMuted === true;
}

/** Guarda la preferencia de silencio. */
export function setMuted(muted: boolean): void {
  const store = safeStorage();
  if (store) {
    store.setItem(MUTE_KEY, muted ? "1" : "0");
    return;
  }
  memoryMuted = muted;
}

// ── Contexto compartido ─────────────────────────────────────────────────────
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/** Contexto de audio diferido + bus master con volumen bajo (8-bit suave). */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.16; // volumen general contenido
    master.connect(ctx.destination);
  }
  return ctx;
}

interface ScheduleOptions {
  /** Tipo de onda: square = lead chiptune, triangle = bajo redondo. */
  type?: OscillatorType;
  /** Volumen relativo de la nota (0–1). */
  volume?: number;
  /** Pequeño glide al empezar (para arpegios). */
  attack?: number;
}

/**
 * Programa una nota en el tiempo indicado del contexto.
 * Devuelve la duración real programada (o 0 si el audio no está disponible).
 */
export function scheduleNote(note: NoteName, startAt: number, duration: number, options: ScheduleOptions = {}): number {
  const audio = getAudioContext();
  if (!audio || !master) return 0;
  // Si el navegador bloquea el autoplay, resume() rechaza: lo tragamos
  // (los osciladores quedan programados y sonarán tras el primer gesto).
  if (audio.state === "suspended") audio.resume().catch(() => undefined);

  const { type = "square", volume = 0.5, attack = 0.004 } = options;
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = type;
  osc.frequency.value = NOTE_FREQUENCIES[note];

  // Envolvente ADSR mínima: ataque casi instantáneo, caída al 70%, release corto.
  const t0 = Math.max(startAt, audio.currentTime);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + attack);
  gain.gain.setValueAtTime(volume * 0.7, t0 + duration * 0.6);
  gain.gain.linearRampToValueAtTime(0, t0 + duration);

  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
  return duration;
}

/**
 * Fanfarria del día 256 (~3.6s, se alinea con la coreografía):
 * 1. Arpegio ascendente "ensamblando bits" (C mayor, semicorcheas)
 * 2. Interleaving: dos voces cruzadas (melodía + bajo)
 * 3. Fanfarria final: C-E-G-C con quinta de cierre
 */
export function celebrationFanfareSchedule(): NoteEvent[] {
  const S = 0.14; // paso de semicorchea
  const events: NoteEvent[] = [];

  // 1. Arpegio ascendente (0.0s – 0.7s): sube el byte bit a bit
  const arpeggio: NoteName[] = ["C4", "E4", "G4", "C5", "E5", "G5", "C6", "E6"];
  arpeggio.forEach((note, i) => events.push({ note, time: i * S * 0.6, duration: S * 0.7 }));

  // 2. Cruzado par/impar (0.7s – 1.6s): dos voces que se intercalan
  const melody: NoteName[] = ["G5", "E5", "C5", "G4", "C5", "E5", "G5", "C6"];
  const bass: NoteName[] = ["C3", "G3", "C3", "G3", "C3", "G3", "C3", "G3"];
  melody.forEach((note, i) => events.push({ note, time: 0.7 + i * S, duration: S * 0.9 }));
  bass.forEach((note, i) => events.push({ note, time: 0.7 + i * S + S / 2, duration: S * 0.5 }));

  // 3. Fanfarria final (1.9s – 3.6s): el byte completo brilla
  const finale: Array<[NoteName, number, number]> = [
    ["C5", 1.9, 0.18], ["E5", 2.1, 0.18], ["G5", 2.3, 0.18],
    ["C6", 2.5, 0.5], ["G5", 3.0, 0.28], ["C6", 3.25, 0.6],
  ];
  finale.forEach(([note, time, duration]) => events.push({ note, time, duration }));
  // Bajo de cierre: C3 sostenido bajo la fanfarria final
  events.push({ note: "C3", time: 2.5, duration: 1.2 });

  return events;
}

/**
 * Reproduce la fanfarria completa si el sonido no está silenciado.
 * Devuelve la duración total en segundos (0 si no suena).
 */
export function playCelebrationFanfare(): number {
  if (isMuted()) return 0;
  const audio = getAudioContext();
  if (!audio) return 0;
  if (audio.state === "suspended") audio.resume().catch(() => undefined);

  const events = celebrationFanfareSchedule();
  const now = audio.currentTime + 0.05;
  for (const ev of events) {
    scheduleNote(ev.note as NoteName, now + ev.time, ev.duration, {
      type: ev.time > 1.9 ? "square" : "triangle",
      volume: ev.time > 1.9 ? 0.55 : 0.42,
    });
  }
  const total = Math.max(...events.map((e) => e.time + e.duration));
  return total;
}
