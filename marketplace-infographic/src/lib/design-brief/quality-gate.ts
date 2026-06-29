import { hexLuminance } from "@/lib/accent-color";
import type { DesignBrief } from "./schema";

export type QualityReport = {
  passed: boolean;
  score: number;
  issues: string[];
};

export type ProcessReviewReport = {
  overallScore: number;
  issues: string[];
};

function hasDuplicateBullets(bullets: string[]): boolean {
  const keys = bullets.map((b) => b.toLowerCase().replace(/\s+/g, " "));
  return new Set(keys).size !== keys.length;
}

export function evaluateDesignProcessReview(brief: DesignBrief): ProcessReviewReport {
  const stage7 = brief.designProcess?.stage7;
  const hook = brief.designProcess?.visualHook ?? brief.visualHook;
  const issues: string[] = [];

  if (!hook?.type) issues.push("missing_visual_hook");
  if (!hook?.reason) issues.push("missing_hook_reason");
  if (hook && hook.confidence < 70) issues.push("weak_visual_hook");

  if (!brief.designProcess?.stage2?.concept && !brief.designConcept) {
    issues.push("missing_artistic_concept");
  }

  if (!stage7) {
    return { overallScore: issues.length > 0 ? 72 : 85, issues };
  }

  const scores = [
    stage7.visualBalance,
    stage7.readability,
    stage7.professionalism,
    stage7.categoryFit,
    stage7.premiumFeel,
    stage7.conversionPotential,
  ].filter((s): s is number => typeof s === "number");

  const overallScore =
    stage7.overallScore ??
    (scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0);

  if (overallScore < 90) issues.push("self_review_below_90");
  for (const [key, val] of Object.entries(stage7) as Array<[string, unknown]>) {
    if (typeof val === "number" && val < 90 && key !== "overallScore") {
      issues.push(`low_${key}`);
    }
  }

  return { overallScore, issues };
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

  const accent = brief.colorPalette?.[0] ?? brief.colors?.[0];
  if (accent && hexLuminance(accent) > 0.72) {
    issues.push("accent_too_light");
  }

  const processReview = evaluateDesignProcessReview(brief);
  issues.push(...processReview.issues.filter((i) => i.startsWith("missing_")));

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (100 - issues.filter((i) => !i.startsWith("low_")).length * 14) * 0.6 +
          processReview.overallScore * 0.4,
      ),
    ),
  );

  return {
    passed: issues.length === 0,
    score,
    issues,
  };
}

export function buildQualityRetryHint(issues: string[]): string {
  if (issues.length === 0) return "";
  return `ИСПРАВЬ ОШИБКИ (этап 7 — пересобери композицию): ${issues.join(", ")}. Пересоздай JSON с нуля, соблюдая visualHook и все правила.`;
}
