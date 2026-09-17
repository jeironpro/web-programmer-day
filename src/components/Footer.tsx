// Footer Ft5 — statement: el cierre es una frase, no columnas de enlaces.
import type { JSX } from "react";
import { useLang } from "@/i18n/LanguageContext";

export function Footer(): JSX.Element {
  const { t, lang, toggle } = useLang();

  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <p className="footer-statement">{t.footer.statement}</p>
        <p className="footer-sub">{t.footer.sub}</p>
        {/* Repetimos el toggle aquí: cierre independiente del nav */}
        <button type="button" className="footer-lang" onClick={toggle} aria-label={t.footer.langTitle}>
          {lang === "es" ? "English" : "Español"}
        </button>
      </div>
    </footer>
  );
}
