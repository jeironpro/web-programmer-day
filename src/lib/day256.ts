// Lógica pura del "día 256" — testeada con Vitest y sin dependencias del DOM.
// Todas las fechas se interpretan en hora local (el día empieza y termina en
// la medianoche de quien visita la página).

/** Número del día que celebramos: 2^8, un byte completo. */
export const DAY_NUMBER = 256;
/** Milisegundos en un día (para cálculos de diferencias). */
export const MS_PER_DAY = 86_400_000;

/** Devuelve true si el año es bisiesto según la regla gregoriana completa. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Número total de días del año dado (365 o 366). */
export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Día del año (1–365/366) para una fecha dada.
 * Se calcula con UTC sobre el mediodía local para evitar bordes de DST.
 */
export function dayOfYear(date: Date): number {
  // Mediodía local: desplaza el instante lejos de cualquier salto de reloj.
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const start = Date.UTC(date.getFullYear(), 0, 1, 12);
  const current = Date.UTC(noon.getFullYear(), noon.getMonth(), noon.getDate(), 12);
  return Math.floor((current - start) / MS_PER_DAY) + 1;
}

/** Fecha de la medianoche local del 1 de enero del año de `date`. */
export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

/** Medianoche local del día 256 del año dado (12-sep en bisiestos, 13-sep el resto). */
export function day256StartOfYear(year: number): Date {
  return new Date(year, 0, DAY_NUMBER);
}

/** Indica si `date` cae dentro de la ventana del día 256 (de 00:00 a 24:00 local). */
export function isDay256(date: Date): boolean {
  return dayOfYear(date) === DAY_NUMBER;
}

/** Medianoche local de la PRÓXIMA ocurrencia del día 256 estrictamente posterior a `now`. */
export function nextDay256Start(now: Date): Date {
  const thisYear = day256StartOfYear(now.getFullYear());
  // Si el día 256 de este año aún no ha terminado, aún no ha "ocurrido".
  const notYetPassed = now.getTime() < thisYear.getTime() + MS_PER_DAY;
  if (notYetPassed) return thisYear;
  return day256StartOfYear(now.getFullYear() + 1);
}

/** Milisegundos restantes hasta la medianoche local siguiente (fin del día actual). */
export function msUntilMidnight(now: Date): number {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return nextMidnight.getTime() - now.getTime();
}

export interface DayState {
  /** true si hoy es el día 256 y toca celebrar. */
  celebrating: boolean;
  /** Número de día de hoy (1–366). */
  today: number;
  /** Total de días del año actual. */
  total: number;
  /** Año en curso. */
  year: number;
  /** Instante objetivo del próximo día 256 (o el actual si celebramos). */
  target: Date;
}

/** Estado completo derivado de un instante dado — la única fuente de verdad de la UI. */
export function getDayState(now: Date = new Date()): DayState {
  const year = now.getFullYear();
  const today = dayOfYear(now);
  const celebrating = today === DAY_NUMBER;
  return {
    celebrating,
    today,
    total: daysInYear(year),
    year,
    target: celebrating ? day256StartOfYear(year) : nextDay256Start(now),
  };
}

/**
 * Override de desarrollo: `?date=YYYY-MM-DDTHH:mm` o `?day=256[&year=2024]`
 * permite previsualizar cualquier estado (contador o celebración) sin tocar el reloj.
 * Devuelve null cuando no hay override o es inválido.
 */
export function readDateOverride(
  search: string = typeof window === "undefined" ? "" : window.location.search,
): Date | null {
  const params = new URLSearchParams(search);
  const dateParam = params.get("date");
  if (dateParam) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(dateParam);
    if (m) {
      const [, y, mo, d, h = "0", mi = "0", s = "0"] = m;
      const parsed = new Date(+y, +mo - 1, +d, +h, +mi, +s);
      // Comprobamos que la ronda no alteró la fecha (detecta días imposibles).
      if (
        parsed.getFullYear() === +y &&
        parsed.getMonth() === +mo - 1 &&
        parsed.getDate() === +d
      ) {
        return parsed;
      }
    }
    return null;
  }
  const dayParam = params.get("day");
  if (dayParam) {
    const day = Number(dayParam);
    const year = Number(params.get("year") ?? new Date().getFullYear());
    if (Number.isInteger(day) && day >= 1 && day <= daysInYear(year) && Number.isInteger(year)) {
      return new Date(year, 0, day, 12);
    }
    return null;
  }
  return null;
}
