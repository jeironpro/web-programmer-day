// App: composición raíz. Decide entre modo contador y modo celebración
// (día 256), mantiene el reloj de 1s y monta el overlay con la escena 3D.
import { useEffect, useState } from "react";
import type { JSX } from "react";
import { LanguageProvider, useLang } from "@/i18n/LanguageContext";
import { useDayState } from "@/hooks/useDayState";
import { DAY_NUMBER } from "@/lib/day256";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Why256 } from "@/components/Why256";
import { ByteDemo } from "@/components/ByteDemo";
import { Footer } from "@/components/Footer";
import { ParallaxBackground } from "@/components/ParallaxBackground";
import { Celebration } from "@/components/Celebration";

// Estilos por sección (un solo entry: main.tsx importa tokens + global).
import "@/styles/background.css";
import "@/styles/nav.css";
import "@/styles/hero.css";
import "@/styles/why.css";
import "@/styles/byte.css";
import "@/styles/footer.css";
import "@/styles/celebration.css";

function Shell(): JSX.Element {
  const day = useDayState();
  const { t } = useLang();
  // La celebración es descartable: el botón la cierra y aparece el contenido.
  const [dismissed, setDismissed] = useState(false);
  const [choreoFinished, setChoreoFinished] = useState(false);

  // Título de la pestaña dinámico.
  useEffect(() => {
    document.title = day.celebrating
      ? `🎉 ${DAY_NUMBER} — ${t.hero.celebratingTitle}`
      : `${DAY_NUMBER} · ${t.hero.countdownLabel}`;
  }, [day.celebrating, t]);

  const showCelebration = day.celebrating && !dismissed;

  return (
    <>
      <ParallaxBackground />
      <Nav day={day} />

      <main>
        <Hero day={day} />
        <Why256 />
        <ByteDemo />
      </main>

      <Footer />

      {/* El 256: byte 3D + coreografía + confeti. "Ver la página" lo cierra. */}
      {showCelebration && (
        <Celebration
          onFinished={choreoFinished ? undefined : () => setChoreoFinished(true)}
          key="celebration"
        />
      )}
      {day.celebrating && choreoFinished && !dismissed && (
        <button type="button" className="cele-dismiss" onClick={() => setDismissed(true)}>
          ✕ {t.celebration.dismiss}
        </button>
      )}
    </>
  );
}

export default function App(): JSX.Element {
  return (
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  );
}
