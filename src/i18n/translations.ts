// Diccionario central de textos en español e inglés.
// La clave `es`/`en` se elige desde LanguageContext; los componentes nunca
// escriben strings de UI directamente, siempre pasan por t(...).

export type Lang = "es" | "en";

/** El diccionario en español actúa como tipo canónico: EN debe coincidir. */
const es = {
  nav: {
    home: "inicio",
    why: "por-que-256",
    byte: "el-byte",
    langLabel: "EN",
    langTitle: "Cambiar a inglés",
    liveTag: "EN VIVO",
    dayTag: "DÍA 256",
    homeAria: "Ir al inicio",
  },
  hero: {
    countEyebrow: "cuenta atrás",
    dayPrefix: "día",
    todayLabel: "hoy",
    celebratingTitle: "Feliz Día del Programador",
    celebratingSub: "Hoy el año llega a su byte 256. 2⁸ = 256. Un byte completo de tiempo.",
    countdownLabel: "para el día 256",
    daysLabel: "días",
    hoursLabel: "horas",
    minutesLabel: "min",
    secondsLabel: "seg",
    cta: "desliza para compilar",
    yearTag: "año {year} · {today}/{total} días",
  },
  why: {
    eyebrow: "por qué 256",
    title: "Porque un byte se escribe una vez al año",
    p1: "El 13 de septiembre es el día 256 de un año común: 2⁸, el número de valores que cabe en un byte. Un byte completo, de 00000000 a 11111111. Los bisiestos lo celebran un día antes, el 12 de septiembre.",
    p2: "La propuesta partió de Valentin Balt en 2002, recogiendo firmas para que Rusia reconociera oficialmente el Día del Programador. Lo logró en 2009, y desde entonces la fecha se celebra en todo el mundo.",
    p3: "¿Por qué importa un número? Porque detrás de cada byte hay alguien que escribe, depura y compila. Hoy es su día.",
    factsTitle: "2⁸ en memoria",
    facts: [
      { bits: "00000000", value: "0" },
      { bits: "00010000", value: "16" },
      { bits: "10000000", value: "128" },
      { bits: "11111111", value: "255" },
    ],
    factsCaption: "cuatro bytes, cuatro valores: así de simple y así de enorme",
  },
  byte: {
    eyebrow: "el byte",
    title: "Ocho bits, un día entero",
    hint: "recorre los bits con el cursor para encenderlos",
    bitsLabel: "byte de la sesión",
    bitOn: "1 — encendido",
    bitOff: "0 — apagado",
    cta: "vuelve el 13 de septiembre",
  },
  footer: {
    statement: "Compilado con cariño por un programador, para los programadores.",
    sub: "Día del Programador · día 256 del año · 2⁸ = 256",
    langTitle: "Cambiar idioma",
  },
  celebration: {
    title: "¡Feliz Día del Programador!",
    byteTag: "byte del día",
    assemble: "ensamblando el byte…",
    interleave: "intercalando bits…",
    reveal: "256 — 2⁸",
    dismiss: "ver la página",
    confettiAria: "Confeti de dígitos binarios cayendo por la pantalla",
  },
};

// La misma forma, en inglés.
const en: typeof es = {
  nav: {
    home: "home",
    why: "why-256",
    byte: "the-byte",
    langLabel: "ES",
    langTitle: "Switch to Spanish",
    liveTag: "LIVE",
    dayTag: "DAY 256",
    homeAria: "Go to top",
  },
  hero: {
    countEyebrow: "countdown",
    dayPrefix: "day",
    todayLabel: "today",
    celebratingTitle: "Happy Programmer's Day",
    celebratingSub: "Today the year reaches its 256th byte. 2⁸ = 256. A full byte of time.",
    countdownLabel: "until day 256",
    daysLabel: "days",
    hoursLabel: "hours",
    minutesLabel: "min",
    secondsLabel: "sec",
    cta: "scroll to compile",
    yearTag: "year {year} · {today}/{total} days",
  },
  why: {
    eyebrow: "why 256",
    title: "Because a byte is written once a year",
    p1: "September 13th is the 256th day of a common year: 2⁸, the number of values a byte can hold. One full byte, from 00000000 to 11111111. Leap years celebrate one day earlier, on September 12th.",
    p2: "The proposal came from Valentin Balt in 2002, gathering signatures for Russia to officially recognize Programmer's Day. It succeeded in 2009, and the date has been celebrated worldwide ever since.",
    p3: "Why does a number matter? Because behind every byte there is someone writing, debugging and compiling. Today is their day.",
    factsTitle: "2⁸ from memory",
    facts: [
      { bits: "00000000", value: "0" },
      { bits: "00010000", value: "16" },
      { bits: "10000000", value: "128" },
      { bits: "11111111", value: "255" },
    ],
    factsCaption: "four bytes, four values: that simple and that huge",
  },
  byte: {
    eyebrow: "the byte",
    title: "Eight bits, one whole day",
    hint: "sweep the bits with your cursor to light them up",
    bitsLabel: "session byte",
    bitOn: "1 — on",
    bitOff: "0 — off",
    cta: "come back on September 13th",
  },
  footer: {
    statement: "Compiled with care by a programmer, for programmers.",
    sub: "Programmer's Day · day 256 of the year · 2⁸ = 256",
    langTitle: "Switch language",
  },
  celebration: {
    title: "Happy Programmer's Day!",
    byteTag: "byte of the day",
    assemble: "assembling the byte…",
    interleave: "interleaving bits…",
    reveal: "256 — 2⁸",
    dismiss: "view the page",
    confettiAria: "Binary digit confetti falling across the screen",
  },
};

export const translations = { es, en } as const;
export type Dictionary = typeof es;
