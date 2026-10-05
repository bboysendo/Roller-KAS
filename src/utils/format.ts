// Display formatting helpers. Pure functions, no React.

const numberFormat = new Intl.NumberFormat('en-US');

/** Whole-number formatting with thousands separators (ROLL is shown floored). */
export function formatInt(value: number): string {
  return numberFormat.format(Math.floor(value));
}

/** ROLL amount with one decimal below 100 so small production is visible. */
export function formatRoll(value: number): string {
  if (value < 100) return value.toFixed(1);
  return formatInt(value);
}

/** Simulated KAS / ZKAS amount or rate, always 3 decimals so small production stays visible. */
export function formatResource(value: number): string {
  return value.toFixed(3);
}

/** Hashrate in TH/s, switches to PH/s above 1000 TH/s. */
export function formatHashrate(th: number): string {
  if (th >= 1000) return `${(th / 1000).toFixed(2)} PH/s`;
  return `${th.toFixed(th < 10 ? 1 : 0)} TH/s`;
}

/** Milliseconds as HH:MM:SS. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
