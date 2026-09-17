// SoundToggle: botón de silencio para la celebración. Persiste la preferencia
// y muestra el estado con un icono (altavoz on/off) + etiqueta aria clara.
import type { JSX } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { scheduleNote, setMuted } from "@/lib/chiptune";

interface SoundToggleProps {
  muted: boolean;
  onChange: (muted: boolean) => void;
}

export function SoundToggle({ muted, onChange }: SoundToggleProps): JSX.Element {
  const { t } = useLang();

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    onChange(next);
    // Al reactivar el sonido, un blip corto confirma que funciona.
    if (!next) scheduleNote("E5", 0, 0.12, { type: "square", volume: 0.4 });
  };

  return (
    <button
      type="button"
      className={`sound-toggle ${muted ? "sound-toggle--off" : ""}`}
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? t.sound.unmute : t.sound.mute}
      title={muted ? t.sound.unmute : t.sound.mute}
    >
      {/* Icono de altavoz dibujado en SVG: sin dependencias externas */}
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 6h3l4-3.5v11L5 10H2z" fill="currentColor" />
        {muted ? (
          // Onda tachada: silenciado
          <path d="M11 5.5l4 5m0-5l-4 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        ) : (
          // Ondas de sonido: activado
          <path
            d="M11 5.2a4 4 0 010 5.6M12.8 3.4a6.5 6.5 0 010 9.2"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
      <span>{muted ? t.sound.off : t.sound.on}</span>
    </button>
  );
}
