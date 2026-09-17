// Celebration: el momento wow del día 256. Monta una superposición a pantalla
// completa con el byte 3D (carga diferida con React.lazy) y coreografía GSAP.
// Robustez: los estados iniciales viven en CSS, la línea de tiempo es simple y
// un temporizador de seguridad garantiza el estado final pase lo que pase.
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { gsap } from "@/lib/gsap";
import { useLang } from "@/i18n/LanguageContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { isMuted, playCelebrationFanfare } from "@/lib/chiptune";
import { SoundToggle } from "./SoundToggle";

// El bundle 3D (three + fiber + drei) solo se descarga el día 256.
const ByteScene = lazy(() => import("./ByteScene"));

/** Detecta si el navegador puede crear un contexto WebGL (barato y síncrono). */
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ?? canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

interface CelebrationProps {
  /** Se llama cuando la coreografía termina (para habilitar el cierre). */
  onFinished?: () => void;
}

/** Un dígito binario que cae con vaivén, generado en DOM puro. */
function ConfettiBit({ index }: { index: number }) {
  const left = (index * 61.803) % 100;
  const delay = ((index * 37) % 60) / 10;
  const duration = 6 + ((index * 13) % 40) / 10;
  const size = 10 + ((index * 7) % 3) * 4;
  return (
    <span
      className="confetti-bit"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        fontSize: `${size}px`,
      }}
    >
      {index % 3 === 0 ? "0" : "1"}
    </span>
  );
}

export function Celebration({ onFinished }: CelebrationProps): JSX.Element {
  const { t } = useLang();
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const onFinishedRef = useRef(onFinished);
  const [showScene, setShowScene] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [choreoDone, setChoreoDone] = useState(false);
  // Estado de silencio para el botón (la preferencia vive en localStorage).
  const [muted, setMutedState] = useState<boolean>(() => isMuted());

  // Mantenemos la callback más reciente sin relanzar la coreografía.
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Reduced motion: overlay estático (CSS ya muestra todo) sin timeline.
    if (reduced) {
      setChoreoDone(true);
      return;
    }

    // finish es idempotente: lo llama onComplete y, si algo interrumpe la
    // línea de tiempo, también el temporizador de seguridad. La clase
    // .cele-done garantiza el estado final por CSS, independientemente de GSAP.
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      root.classList.add("cele-done");
      gsap.set(".cele-bit", { clearProps: "transform,opacity" });
      gsap.set(".cele-byte", { clearProps: "transform" });
      gsap.set(".cele-title, .cele-tag, .cele-sub", { opacity: 1, y: 0 });
      setChoreoDone(true);
      onFinishedRef.current?.();
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: finish });

      tl // 1. El overlay se funde desde negro
        .fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power1.out" })
        // 2. Los ocho bits caen y se ensamblan en fila
        .fromTo(
          ".cele-bit",
          { y: -140, opacity: 0, rotation: () => gsap.utils.random(-35, 35) },
          { y: 0, opacity: 1, rotation: 0, duration: 0.65, stagger: 0.08, ease: "power2.out" },
          "-=0.05",
        )
        // 3. Interleaving: pares e impares cruzan verticalmente una vez
        .to(
          ".cele-bit",
          { y: (i: number) => (i % 2 === 0 ? -10 : 10), duration: 0.22, ease: "power1.inOut", yoyo: true, repeat: 1 },
          "+=0.1",
        )
        // 4. Pulso de encendido del byte completo
        .fromTo(".cele-byte", { scale: 1 }, { scale: 1.05, duration: 0.2, ease: "power1.out", yoyo: true, repeat: 1 }, "-=0.05")
        // 5. Reveal del titular, el tag y el subtítulo
        .fromTo(
          ".cele-title, .cele-tag, .cele-sub",
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.09, ease: "power2.out" },
          "-=0.05",
        );
    }, root);

    // La fanfarria arranca con el ensamblado del byte. Los navegadores exigen
    // un gesto previo para el audio; si no lo hay, simplemente no suena.
    playCelebrationFanfare();

    // Red de seguridad: si la línea de tiempo no llega al final (p. ej. por
    // bloqueos del hilo principal), forzamos el estado final a los 3.2s.
    const safety = window.setTimeout(finish, 3_200);

    return () => {
      window.clearTimeout(safety);
      ctx.revert();
    };
  }, [reduced]);

  // La escena 3D se monta tras el ensamblado (no compite con la coreografía).
  // Si no hay WebGL (o el contexto muere), el byte 2D ya cubre la celebración.
  useEffect(() => {
    if (reduced || !isWebGLAvailable()) {
      setSceneFailed(true);
      return;
    }
    const timer = window.setTimeout(() => setShowScene(true), 1_200);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  return (
    <div className="celebration" ref={rootRef} role="dialog" aria-label={t.celebration.title}>
      {/* Confeti binario (DOM puro, barato) */}
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 40 }, (_, i) => (
          <ConfettiBit key={i} index={i} />
        ))}
      </div>

      {/* Escena 3D de fondo: cubos de bits + partículas + parallax de cámara */}
      {showScene && !sceneFailed && (
        <div className="cele-scene" aria-hidden="true">
          <Suspense fallback={null}>
            <ByteScene reduced={reduced} onContextLost={() => setSceneFailed(true)} />
          </Suspense>
        </div>
      )}

      {/* Byte 2D que se ensambla con GSAP (funciona también sin WebGL) */}
      <div className="cele-byte" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="cele-bit">
            {i % 2}
          </span>
        ))}
      </div>

      <h2 className="cele-title">{t.celebration.title}</h2>
      <p className="cele-tag">{t.celebration.reveal}</p>
      <p className="cele-sub">{choreoDone ? t.hero.celebratingSub : t.celebration.assemble}</p>

      {/* Fanfarria: botón de silencio persistente */}
      <SoundToggle muted={muted} onChange={setMutedState} />
    </div>
  );
}
