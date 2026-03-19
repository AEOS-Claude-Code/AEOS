"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 to the target value using requestAnimationFrame.
 * Respects prefers-reduced-motion — returns target immediately if set.
 */
export function useAnimatedNumber(
  target: number,
  duration = 800,
  enabled = true,
): number {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (!enabled || target === 0) {
      setValue(target);
      return;
    }

    // Respect reduced motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }

    startTime.current = null;
    setValue(0);

    function tick(now: number) {
      if (startTime.current === null) startTime.current = now;
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick);
      }
    }

    rafId.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration, enabled]);

  return value;
}
