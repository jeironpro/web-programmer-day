// ByteDemo: ocho bits interactivos. Al pasar el cursor (o enfocar) se
// encienden en verde fósforo y recomponen el valor del byte en vivo.
import { useState } from "react";
import type { JSX } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { Reveal } from "./Reveal";

export function ByteDemo(): JSX.Element {
  const { t } = useLang();
  // Estado local: qué bits están encendidos (por hover/foco/teclado).
  const [litBits, setLitBits] = useState<number[]>([]);

  const lightUp = (index: number) =>
    setLitBits((prev) => (prev.includes(index) ? prev : [...prev, index]));
  const resetBits = () => setLitBits([]);

  // Byte mostrado: bit 7 (MSB) a la izquierda, como se escribe de verdad.
  const bits = Array.from({ length: 8 }, (_, i) => 7 - i);
  const value = bits.reduce((acc, bit) => acc + (litBits.includes(bit) ? 2 ** bit : 0), 0);

  return (
    <section className="section shell" id="the-byte">
      <Reveal>
        <div className="section-head">
          <p className="eyebrow">{t.byte.eyebrow}</p>
          <h2 className="section-title">{t.byte.title}</h2>
        </div>
      </Reveal>

      <Reveal delay={90}>
        <p className="byte-hint">{t.byte.hint}</p>
      </Reveal>

      {/* El byte interactivo. Cada bit es un botón real: usable con teclado. */}
      <Reveal delay={140}>
        <div
          className="byte-row"
          role="group"
          aria-label={t.byte.bitsLabel}
          onMouseLeave={resetBits}
          onBlur={resetBits}
        >
          {bits.map((bit) => {
            const lit = litBits.includes(bit);
            return (
              <button
                key={bit}
                type="button"
                className={`bit ${lit ? "bit--on" : ""}`}
                aria-pressed={lit}
                aria-label={`${lit ? t.byte.bitOn : t.byte.bitOff} (2^${bit})`}
                onMouseEnter={() => lightUp(bit)}
                onFocus={() => lightUp(bit)}
                onClick={() => lightUp(bit)}
              >
                <span className="bit-value">{lit ? 1 : 0}</span>
                <span className="bit-weight">2^{bit}</span>
              </button>
            );
          })}
        </div>

        {/* Lectura en vivo del byte compuesto */}
        <p className="byte-readout" aria-live="polite">
          0b{bits.map((b) => (litBits.includes(b) ? 1 : 0)).join("")} ={" "}
          <strong>{value}</strong>
        </p>
      </Reveal>

      <Reveal delay={200}>
        <p className="byte-cta">{t.byte.cta}</p>
      </Reveal>
    </section>
  );
}
