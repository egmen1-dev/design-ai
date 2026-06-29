import { EMA_ALPHA } from "./types";

export function computeSuccessSignal(scores: {
  designScore?: number;
  artDirectorScore?: number;
  marketplaceScore?: number;
  photographerScore?: number;
  ctrPrediction?: number;
  userLiked?: boolean | null;
}): { outcome: number; successful: boolean } {
  let outcome = 0.2;

  if (typeof scores.designScore === "number") {
    outcome += (scores.designScore / 100) * 0.2;
  }
  if (typeof scores.artDirectorScore === "number") {
    outcome += (scores.artDirectorScore / 100) * 0.2;
  }
  if (typeof scores.marketplaceScore === "number") {
    outcome += (scores.marketplaceScore / 100) * 0.2;
  }
  if (typeof scores.photographerScore === "number") {
    outcome += (scores.photographerScore / 100) * 0.15;
  }
  if (typeof scores.ctrPrediction === "number") {
    outcome += Math.min(0.25, scores.ctrPrediction * 0.25);
  }
  if (scores.userLiked === true) outcome += 0.2;
  if (scores.userLiked === false) outcome -= 0.35;

  outcome = Math.max(0, Math.min(1, outcome));
  return { outcome, successful: outcome >= 0.58 };
}

export function emaWeight(current: number, target: number, alpha = EMA_ALPHA): number {
  return alpha * target + (1 - alpha) * current;
}

export function emaAverage(current: number, sample: number, alpha = EMA_ALPHA): number {
  return alpha * sample + (1 - alpha) * current;
}

export function outcomeToWeight(outcome: number, usages: number): number {
  const base = 0.5 + outcome;
  const confidence = Math.min(1, usages / 20);
  return Number((base * (0.7 + confidence * 0.3)).toFixed(3));
}

export function formatWeightLabel(weight: number): string {
  if (weight >= 1.5) return "высокий";
  if (weight >= 1.0) return "средний";
  if (weight >= 0.7) return "низкий";
  return "избегать";
}
