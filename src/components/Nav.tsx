// Nav N5 — floating pill: píldora flotante con blur sobre el lienzo oscuro.
// En modo celebración la etiqueta "EN VIVO" pasa a "DÍA 256".
import { useLang } from "@/i18n/LanguageContext";
import type { DayState } from "@/lib/day256";

interface NavProps {
  day: DayState;
}

export function Nav({ day }: NavProps) {
  const { t, toggle } = useLang();

  return (
    <header className="nav-wrap">
      <nav className="nav-pill" aria-label="principal">
        {/* Wordmark estilo ruta de terminal */}
        <a className="nav-mark" href="#top" aria-label={t.nav.homeAria}>
          <span className="nav-prompt">~/</span>programmer-day
        </a>

        {/* Anclas a secciones */}
        <div className="nav-links">
          <a href="#why-256">{t.nav.why}</a>
          <a href="#the-byte">{t.nav.byte}</a>
        </div>

        {/* Etiqueta de estado: EN VIVO o DÍA 256 */}
        <span className={`nav-tag ${day.celebrating ? "nav-tag--day" : ""}`}>
          <span className="nav-dot" aria-hidden="true" />
          {day.celebrating ? t.nav.dayTag : t.nav.liveTag}
        </span>

        {/* Toggle ES/EN: muestra el idioma al que se cambia */}
        <button type="button" className="nav-lang" onClick={toggle} title={t.nav.langTitle} aria-label={t.nav.langTitle}>
          {t.nav.langLabel}
        </button>
      </nav>
    </header>
  );
}
