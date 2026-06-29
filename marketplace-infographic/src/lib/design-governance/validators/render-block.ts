import type { FinalDesignBlueprint } from "../blueprint/types";
import {
  PROFESSIONAL_NEAR_MISS,
  PROFESSIONAL_SCORE_THRESHOLD,
} from "../scores/evaluate";

export class RenderBlockedError extends Error {
  readonly code = "RENDER_BLOCKED";
  readonly reasons: string[];

  constructor(reasons: string[]) {
    super(`Render blocked: ${reasons.join("; ")}`);
    this.name = "RenderBlockedError";
    this.reasons = reasons;
  }
}

export function assertRenderAllowed(input: {
  blueprint?: FinalDesignBlueprint;
  constitutionPassed: boolean;
  professionalScore: number;
  backgroundResolved: boolean;
  sceneResolved: boolean;
  lightingResolved: boolean;
  compositionResolved: boolean;
  layoutResolved: boolean;
  skipProfessionalCheck?: boolean;
  /** True when scene compositor merged product into AI background */
  hasComposite?: boolean;
}): void {
  const reasons: string[] = [];

  if (!input.sceneResolved) reasons.push("Scene unresolved");
  if (!input.lightingResolved) reasons.push("Lighting unresolved");
  if (!input.compositionResolved) reasons.push("Composition unresolved");
  if (!input.layoutResolved) reasons.push("Layout unresolved");
  if (!input.blueprint?.locked) reasons.push("Design blueprint not locked by resolver");
  if (!input.constitutionPassed) reasons.push("Constitution failed");

  const nearMissBand =
    input.professionalScore >= PROFESSIONAL_SCORE_THRESHOLD - PROFESSIONAL_NEAR_MISS;
  const professionalOk =
    input.skipProfessionalCheck ||
    input.professionalScore >= PROFESSIONAL_SCORE_THRESHOLD ||
    (nearMissBand &&
      input.constitutionPassed &&
      input.backgroundResolved);

  if (!professionalOk) {
    reasons.push(
      `Professional score ${input.professionalScore} below threshold ${PROFESSIONAL_SCORE_THRESHOLD}`,
    );
  } else if (
    input.professionalScore < PROFESSIONAL_SCORE_THRESHOLD &&
    input.professionalScore >= PROFESSIONAL_SCORE_THRESHOLD - PROFESSIONAL_NEAR_MISS
  ) {
    console.info(
      `[design-governance] professional near-miss ${input.professionalScore}/${PROFESSIONAL_SCORE_THRESHOLD} — allowed (AI background)`,
    );
  }

  if (reasons.length > 0) {
    throw new RenderBlockedError(reasons);
  }
}

export function logGovernancePipeline(steps: Array<{ label: string; ok: boolean; detail?: string }>) {
  for (const s of steps) {
    const mark = s.ok ? "✓" : "✗";
    console.info(`[design-governance] ${mark} ${s.label}${s.detail ? ` — ${s.detail}` : ""}`);
  }
}
