// Reveal: aparece una vez cuando entra en viewport (IntersectionObserver,
// nunca listeners de scroll). Con reduced-motion queda visible sin animación.
import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface RevealProps {
  children: JSX.Element | JSX.Element[];
  /** Retardo propio dentro de un grupo (ms). */
  delay?: number;
  /** Desplazamiento vertical inicial (px). */
  y?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, y = 24, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: visible directamente, sin observer ni animación.
    if (reduced) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();
          gsap.fromTo(
            el,
            { opacity: 0, y },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              delay: delay / 1000,
              ease: "power3.out",
              clearProps: "transform",
              onStart: () => el.classList.add("is-visible"),
            },
          );
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, y, reduced]);

  return (
    <div ref={ref} className={`reveal ${className ?? ""}`}>
      {children}
    </div>
  );
}
