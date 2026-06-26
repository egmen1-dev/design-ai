import type { DesignBrief } from "./schema";

export type QualityReport = {
  passed: boolean;
  score: number;
  issues: string[];
};

function hasDuplicateBullets(bullets: string[]): boolean {
  const keys = bullets.map((b) => b.toLowerCase().replace(/\s+/g, " "));
  return new Set(keys).size !== keys.length;
}

export function evaluateDesignBrief(brief: DesignBrief): QualityReport {
  const issues: string[] = [];
  const bullets = brief.bullets ?? brief.benefits ?? [];

  if (!brief.headline && !brief.title) issues.push("missing_headline");
  if (bullets.length > 5) issues.push("too_many_bullets");
  if (hasDuplicateBullets(bullets)) issues.push("duplicate_bullets");

  const bg = brief.backgroundPrompt.toLowerCase();
  if (/trimmer|generator|product|tool|триммер|товар/.test(bg)) {
    issues.push("product_in_background");
  }

  if ((brief.colorPalette ?? brief.colors ?? []).length < 2) {
    issues.push("weak_palette");
  }

  if (bullets.some((b) => b.length > 70)) issues.push("text_too_long");

  const score = Math.max(0, 100 - issues.length * 18);
  return {
    passed: issues.length === 0,
    score,
    issues,
  };
}

export function buildQualityRetryHint(issues: string[]): string {
  if (issues.length === 0) return "";
  return `ИСПРАВЬ ОШИБКИ: ${issues.join(", ")}. Пересоздай JSON с нуля, соблюдая все правила.`;
}
