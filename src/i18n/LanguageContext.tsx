// Contexto de idioma: proporciona `lang`, `t` (diccionario) y `setLang`.
// Persiste la preferencia en localStorage y aplica el atributo lang del
// documento para accesibilidad. Sin dependencias externas.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import { translations } from "./translations";
import type { Dictionary, Lang } from "./translations";

const STORAGE_KEY = "programmer-day.lang";

/** Lee el idioma inicial: query param ?lang, localStorage o heurística del navegador. */
function readInitialLang(): Lang {
  if (typeof window !== "undefined") {
    const fromQuery = new URLSearchParams(window.location.search).get("lang");
    if (fromQuery === "en" || fromQuery === "es") return fromQuery;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "es") return stored;
    } catch {
      // localStorage bloqueado: seguimos con la heurística del navegador
    }
    if (!navigator.language.toLowerCase().startsWith("en")) return "es";
    return "en";
  }
  return "es";
}

interface LanguageContextValue {
  lang: Lang;
  t: Dictionary;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Proveedor único de idioma para toda la app. */
export function LanguageProvider({ children }: { children: JSX.Element | JSX.Element[] }) {
  const [lang, setLang] = useState<Lang>(readInitialLang);

  // Persistimos la elección y la reflejamos en <html lang>.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Sin persistencia disponible: no es crítico.
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = useCallback(() => setLang((l) => (l === "es" ? "en" : "es")), []);
  const value = useMemo<LanguageContextValue>(() => ({ lang, t: translations[lang], toggle }), [lang, toggle]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Hook de acceso al idioma y a los textos. */
export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang debe usarse dentro de <LanguageProvider>");
  return ctx;
}
