import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly tweens a number toward `target`. Used for the big stat readouts.
 * Snaps immediately when the change is tiny or the user prefers reduced motion.
 */
export function useAnimatedNumber(target: number, durationMs = 400): number {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);

  useEffect(() => {
    const from = valueRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || Math.abs(target - from) < 0.01) {
      valueRef.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      valueRef.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
