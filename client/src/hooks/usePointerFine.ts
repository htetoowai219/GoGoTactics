import { useEffect, useState } from "react";

const FINE_POINTER_QUERY = "(pointer: fine)";

/**
 * True on mouse/trackpad devices. Drag-and-drop is gated on this because on
 * touch it fights the scroll gesture (chips carry `touch-none`) and drop
 * targets are small. Touch uses tap-to-pick / tap-to-drop instead.
 */
export function usePointerFine(): boolean {
  const [fine, setFine] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(FINE_POINTER_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(FINE_POINTER_QUERY);
    const onChange = () => setFine(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return fine;
}
