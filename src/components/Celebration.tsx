// Celebration: el momento wow del día 256. Monta una superposición a pantalla
// completa con el byte 3D permanente y coreografía GSAP para los textos.
// El byte 3D SON los bits 01010101: ocho cubos con el dígito incrustado que
// están en pantalla desde el primer fotograma y no desaparecen nunca. El byte
// 2D del DOM es solo la reserva si WebGL no está disponible (se oculta cuando
// el canvas 3D está vivo y solo reaparece si el contexto muere sin remedio).
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { gsap } from "@/lib/gsap";
import { useLang } from "@/i18n/LanguageContext";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useEventCallbackRef } from "@/hooks/useEventCallbackRef";
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
  // Ref estable: la coreografía usa siempre la callback más reciente sin relanzarse.
  const onFinishedRef = useEventCallbackRef(onFinished);
  const [showScene, setShowScene] = useState(false);
  const [sceneLive, setSceneLive] = useState(false);
  const [sceneFatal, setSceneFatal] = useState(false);
  const [choreoDone, setChoreoDone] = useState(false);
  // Estado de silencio para el botón (la preferencia vive en localStorage).
  const [muted, setMutedState] = useState<boolean>(() => isMuted());

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
        // 2. Los ocho bits DOM caen y se ensamblan en fila (solo visibles si
        //    WebGL no llega; con la escena 3D este byte queda oculto por CSS)
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
        // 4. Pulso del contenedor del byte (inocuo si está oculto por el 3D)
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

  // El byte 3D se monta junto con la celebración y PERMANECE: el contenedor
  // nunca se desmonta. Si no hay WebGL (o el contexto muere de forma fatal),
  // el byte 2D del DOM toma el relevo.
  useEffect(() => {
    if (!isWebGLAvailable()) return;
    setShowScene(true);
  }, []);

  return (
    <div className="celebration" ref={rootRef} role="dialog" aria-label={t.celebration.title}>
      {/* Confeti binario (DOM puro, barato) */}
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 40 }, (_, i) => (
          <ConfettiBit key={i} index={i} />
        ))}
      </div>

      {/* Byte 3D: los bits 01010101 con el dígito incrustado en las caras.
          Presente desde el primer fotograma de la celebración; nunca se
          desmonta ni desaparece. */}
      {showScene && (
        <div className="cele-scene" aria-hidden="true">
          <Suspense fallback={null}>
            <ByteScene
              reduced={reduced}
              onReady={() => setSceneLive(true)}
              onFatal={() => setSceneFatal(true)}
            />
          </Suspense>
        </div>
      )}

      {/* Byte 2D de reserva: solo protagonista si el 3D no puede estar.
          Mientras la escena 3D vive, permanece oculto (visible para el
          ensamblado GSAP y para lectores de pantalla, invisible en pantalla). */}
      <div className={`cele-byte${sceneLive && !sceneFatal ? " cele-byte--hidden" : ""}`} aria-hidden="true">
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
