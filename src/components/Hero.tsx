// Hero (Stat-Led): el número manda. Muestra el día actual del año y la
// cuenta atrás hacia el día 256 con dígitos animados por GSAP. Cuando llega
// el día 256, el bloque de countdown muta en el titular de celebración.
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useLang } from "@/i18n/LanguageContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { DayState } from "@/lib/day256";
import { DAY_NUMBER } from "@/lib/day256";

/** Parte un intervalo en días/horas/min/seg, cada bloque con padding fijo. */
function timeParts(target: Date, now: Date): { d: string; h: string; m: string; s: string } {
  const ms = Math.max(0, target.getTime() - now.getTime());
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86_400);
  const h = Math.floor((total % 86_400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
}

/** Un dígito que se anima con GSAP cuando cambia su valor. */
function Digit({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    // Solo animamos en cambios reales de valor (el montaje inicial no anima).
    if (!el || reduced || prev.current === value) return;
    prev.current = value;
    gsap.fromTo(
      el,
      { yPercent: -70, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.32, ease: "power3.out" },
    );
  }, [value, reduced]);

  return (
    <span className="digit" ref={ref}>
      {value}
    </span>
  );
}

/** Grupo de countdown: dígitos apilables de longitud variable + etiqueta. */
function CountGroup({ value, label }: { value: string; label: string }) {
  return (
    <span className="count-group">
      <span className="count-digits" aria-hidden="true">
        {value.split("").map((c, i) => (
          <Digit key={`${i}-${value.length}`} value={c} />
        ))}
      </span>
      <span className="count-label">{label}</span>
    </span>
  );
}

interface HeroProps {
  day: DayState;
}

export function Hero({ day }: HeroProps) {
  const { t, lang } = useLang();
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Orquestación de entrada: una sola secuencia con stagger sobre los elementos
  // marcados con data-hero-reveal (en orden de DOM).
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-reveal]"));
    if (reduced) {
      targets.forEach((el) => (el.style.opacity = "1"));
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", delay: 0.15 },
      );
    });
    return () => ctx.revert();
  }, [reduced, lang, day.celebrating]);

  const { d, h, m, s } = timeParts(day.target, new Date());

  return (
    <section className="hero shell" id="top" ref={sectionRef}>
      {/* Lectura del año en vivo: día actual / total */}
      <p className="hero-meta" data-hero-reveal>
        <span className="hero-meta-accent">{DAY_NUMBER}</span>
        <span className="hero-meta-sep">·</span>
        {t.hero.yearTag
          .replace("{year}", String(day.year))
          .replace("{today}", String(day.today))
          .replace("{total}", String(day.total))}
      </p>

      {/* Titular: celebración o cuenta atrás */}
      {day.celebrating ? (
        <>
          <h1 className="hero-title" data-hero-reveal>
            {t.hero.celebratingTitle}
          </h1>
          <p className="hero-sub" data-hero-reveal>
            {t.hero.celebratingSub}
          </p>
        </>
      ) : (
        <>
          <p className="hero-eyebrow" data-hero-reveal>
            {t.hero.countEyebrow}
          </p>
          <h1
            className="hero-count"
            data-hero-reveal
            aria-label={`${d} ${t.hero.daysLabel} ${h} ${t.hero.hoursLabel} ${m} ${t.hero.minutesLabel} ${s} ${t.hero.secondsLabel}`}
          >
            <CountGroup value={d} label={t.hero.daysLabel} />
            <span className="count-sep" aria-hidden="true">
              :
            </span>
            <CountGroup value={h} label={t.hero.hoursLabel} />
            <span className="count-sep" aria-hidden="true">
              :
            </span>
            <CountGroup value={m} label={t.hero.minutesLabel} />
            <span className="count-sep" aria-hidden="true">
              :
            </span>
            <CountGroup value={s} label={t.hero.secondsLabel} />
          </h1>
          <p className="hero-sub" data-hero-reveal>
            {t.hero.countdownLabel}
          </p>
        </>
      )}

      {/* CTA de scroll */}
      <a className="hero-cta" href="#why-256" data-hero-reveal>
        <span>{t.hero.cta}</span>
        <span className="hero-cta-arrow" aria-hidden="true">
          ↓
        </span>
      </a>
    </section>
  );
}
