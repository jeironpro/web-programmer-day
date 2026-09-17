// ParallaxBackground: tres capas de fondo con parallax de scroll (GSAP
// ScrollTrigger, solo transform/opacity). Es decorativo: aria-hidden.
// Con reduced-motion las capas quedan fijas (sin scrub).
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/** Cadenas de "código" muy tenues que flotan detrás del contenido. */
const FOG_LINES = [
  "01101100 01101001 01101110 01100101",
  "while (year) { day++; compile(); }",
  "0xFF 0x1F 0x8B 0x00 0xA2",
  "git commit -m \"day 256\"",
  "2**8 === 256 // true",
  "0b11111111",
  "if (today === day256) celebrate();",
  "sudo make me a byte",
];

export function ParallaxBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;

    const ctx = gsap.context(() => {
      // Capa 1 — glow fósforo: sube más despacio que el scroll (profundidad lejana)
      gsap.to(".bg-glow", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1.2 },
      });

      // Capa 2 — constelación de puntos: velocidad media
      gsap.to(".bg-stars", {
        yPercent: -12,
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1.6 },
      });

      // Capa 3 — niebla de código: la más rápida (profundidad cercana) + drift lateral
      gsap.to(".bg-fog", {
        yPercent: -30,
        xPercent: -4,
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 2 },
      });
    }, root);

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, [reduced]);

  return (
    <div ref={rootRef} className="parallax-bg" aria-hidden="true">
      {/* Capa 1: glow radial lejano */}
      <div className="bg-glow" />

      {/* Capa 2: constelación de puntos (SVG generado en línea) */}
      <svg className="bg-stars" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="star-dot">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 46 }, (_, i) => {
          // Posiciones pseudoaleatorias deterministas (sin Math.random para SSR/test estables)
          const x = ((i * 137.508) % 100).toFixed(2);
          const y = ((i * 61.803) % 100).toFixed(2);
          const r = 1 + ((i * 7) % 3) * 0.8;
          return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="url(#star-dot)" opacity={0.35} />;
        })}
      </svg>

      {/* Capa 3: niebla de código */}
      <div className="bg-fog">
        {FOG_LINES.map((line, i) => (
          <span
            key={i}
            className="fog-line"
            style={{ top: `${8 + ((i * 13) % 84)}%`, "--fog-i": i } as React.CSSProperties}
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
