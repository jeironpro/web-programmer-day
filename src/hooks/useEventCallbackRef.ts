// Hook utilitario: ref estable que siempre apunta a la callback más reciente.
// Permite que listeners y efectos usen la función sin depender de su identidad
// (no se relanzan cuando la callback cambia en cada render).
import { useEffect, useRef } from "react";
import type { RefObject } from "react";

export function useEventCallbackRef<T extends (...args: never[]) => unknown>(
  callback: T | undefined,
): RefObject<T | undefined> {
  const ref = useRef<T | undefined>(callback);
  useEffect(() => {
    ref.current = callback;
  });
  return ref;
}
