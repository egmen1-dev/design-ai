import { createHash } from "crypto";

export type Rng = () => number;

export function createSeededRng(seed: string): Rng {
  let state = createHash("sha256").update(seed).digest().readUInt32BE(0);
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/** Случайное значение в диапазоне [min, max] */
export function pickRange(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Базовое значение + jitter ±jitterPct% */
export function applyJitter(rng: Rng, value: number, jitterPct: number): number {
  const delta = (rng() * 2 - 1) * (jitterPct / 100);
  return value * (1 + delta);
}

export const JITTER = {
  product: 5,
  headline: 4,
  plaque: 3,
  icon: 2,
  decor: 5,
} as const;
