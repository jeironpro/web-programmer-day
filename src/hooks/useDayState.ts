// Hook que mantiene vivo el estado del día: se recalcula cada segundo para
// que el contador y el cambio de modo (celebración -> contador) ocurran en
// la medianoche real sin recargar la página.
import { useEffect, useState } from "react";
import { getDayState, readDateOverride } from "@/lib/day256";
import type { DayState } from "@/lib/day256";

/**
 * Devuelve el estado del día actualizado cada segundo.
 * Si la URL incluye `?date=...` o `?day=...`, el "ahora" es esa fecha
 * (útil para previsualizar la celebración sin esperar al 13 de septiembre).
 */
export function useDayState(): DayState {
  // El override se lee una sola vez por carga de página.
  const [override] = useState<Date | null>(() => readDateOverride());
  const [state, setState] = useState<DayState>(() => getDayState(override ?? new Date()));

  useEffect(() => {
    const tick = () => setState(getDayState(override ?? new Date()));
    const interval = window.setInterval(tick, 1_000);
    return () => window.clearInterval(interval);
  }, [override]);

  return state;
}
