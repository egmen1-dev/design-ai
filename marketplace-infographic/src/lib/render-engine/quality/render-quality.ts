import type { RenderRequest } from "../types";
import type { CompositionLayout } from "@/lib/composition/types";
import type { CardMeaning } from "@/lib/layout-engine/types";
import type { LayoutSpec } from "@/lib/design/layout-spec";

export type RenderQualityInput = {
  request: RenderRequest;
  layoutSpec?: LayoutSpec;
  layout?: CompositionLayout;
  meaning?: CardMeaning;
  luxuryScore?: number;
  compositionScore?: number;
  sceneScore?: number;
};

export type RenderQualityScores = {
  visionScore: number;
  compositionScore: number;
  sceneScore: number;
  constitutionScore: number;
  overallDesignScore: number;
  passed: boolean;
  issues: string[];
};

/**
 * Render quality gate — wraps existing critics without LLM vision (deterministic).
 * Vision critic hook reserved for future multimodal pass.
 */
export function evaluateRenderQuality(input: RenderQualityInput): RenderQualityScores {
  const issues: string[] = [];
  let visionScore = 78;
  let compositionScore = input.compositionScore ?? 80;
  let sceneScore = input.sceneScore ?? 80;
  let constitutionScore = input.request.metadata?.constitutionPassed ? 90 : 75;

  const m = input.layout?.metrics;
  if (m) {
    if (m.whitespacePct < 20 || m.whitespacePct > 35) {
      issues.push(`whitespace ${m.whitespacePct.toFixed(1)}% out of band`);
      compositionScore -= 12;
    }
    if (m.productAreaPct < 35 || m.productAreaPct > 50) {
      issues.push(`hero area ${m.productAreaPct.toFixed(1)}% out of band`);
      compositionScore -= 10;
    }
    if (m.overlapPct > 2) {
      issues.push("text/product overlap");
      visionScore -= 15;
    }
  }

  if (input.request.scene.visualDensity > 0.18) {
    issues.push("scene visual density high");
    sceneScore -= 10;
  }

  const overallDesignScore = Math.round(
    visionScore * 0.2 +
      compositionScore * 0.3 +
      sceneScore * 0.25 +
      constitutionScore * 0.25,
  );

  const passed = overallDesignScore >= 85 && issues.length <= 1;

  return {
    visionScore,
    compositionScore,
    sceneScore,
    constitutionScore,
    overallDesignScore,
    passed,
    issues,
  };
}
