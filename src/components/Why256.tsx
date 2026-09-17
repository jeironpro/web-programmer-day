// Sección "¿Por qué 256?": prosa honesta (sin métricas inventadas) y una
// tabla de valores reales de un byte. Los bloques entran con Reveal.
import type { JSX } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { Reveal } from "./Reveal";

export function Why256(): JSX.Element {
  const { t } = useLang();

  return (
    <section className="section shell" id="why-256">
      <Reveal>
        <div className="section-head">
          <p className="eyebrow">{t.why.eyebrow}</p>
          <h2 className="section-title">{t.why.title}</h2>
        </div>
      </Reveal>

      <Reveal delay={90}>
        <div className="prose">
          <p>{t.why.p1}</p>
          <p>{t.why.p2}</p>
          <p>
            <strong>{t.why.p3}</strong>
          </p>
        </div>
      </Reveal>

      {/* Tabla de valores reales de un byte (f3 tabular-spec-sheet de hallmark) */}
      <Reveal delay={140}>
        <figure className="byte-facts">
          <figcaption className="byte-facts-title">{t.why.factsTitle}</figcaption>
          <table>
            <tbody>
              {t.why.facts.map((fact) => (
                <tr key={fact.bits}>
                  <td className="byte-facts-bits">{fact.bits}</td>
                  <td className="byte-facts-eq">=</td>
                  <td className="byte-facts-value">{fact.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="byte-facts-caption">{t.why.factsCaption}</p>
        </figure>
      </Reveal>
    </section>
  );
}
