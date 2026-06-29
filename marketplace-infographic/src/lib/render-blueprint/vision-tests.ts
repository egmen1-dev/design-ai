/**
 * Chapter 3.17 — Vision test checks (known defect detection)
 */
import type { RenderBlueprint } from "./types";

export type VisionIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export function detectVisionIssues(blueprint: RenderBlueprint): VisionIssue[] {
  const issues: VisionIssue[] = [];

  if (blueprint.composition.template === "hero_center" && blueprint.constraints.mustLeaveHeadlineSpace) {
    issues.push({
      code: "HERO_POSITION",
      message: "Hero center conflicts with headline space constraint",
      severity: "warning",
    });
  }

  if (blueprint.background.decorDensity > 0.6 && blueprint.constraints.mustLeaveHeadlineSpace) {
    issues.push({
      code: "WHITESPACE",
      message: "Insufficient whitespace for marketplace headline",
      severity: "error",
    });
  }

  if (blueprint.photography.backgroundBlur < 0.1 && blueprint.scene.depth === "shallow") {
    issues.push({
      code: "OVERLAY",
      message: "Product may feel like PNG overlay — background too sharp",
      severity: "warning",
    });
  }

  if (blueprint.lighting.shadowSoftness < 0.2) {
    issues.push({
      code: "LIGHTING",
      message: "Hard shadows reduce integration quality",
      severity: "warning",
    });
  }

  if (blueprint.photography.contrast === "high" && blueprint.photography.realism > 0.9) {
    issues.push({
      code: "PHOTO_QUALITY",
      message: "High contrast may clip product detail",
      severity: "warning",
    });
  }

  return issues;
}

export function visionScoreFromBlueprint(blueprint: RenderBlueprint): number {
  const issues = detectVisionIssues(blueprint);
  const penalty = issues.reduce((s, i) => s + (i.severity === "error" ? 15 : 5), 0);
  return Math.max(0, 100 - penalty);
}
