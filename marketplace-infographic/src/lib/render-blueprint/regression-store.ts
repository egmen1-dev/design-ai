/**
 * Chapter 3.17 — Regression baseline store and comparison
 */
import type { RegressionBaseline, RegressionComparison } from "./testing-types";
import { computeBlueprintChecksum } from "./serialization";
import type { RenderBlueprint } from "./types";

export class RegressionStore {
  private readonly baselines = new Map<string, RegressionBaseline>();

  setBaseline(baseline: RegressionBaseline): void {
    this.baselines.set(baseline.productId, baseline);
  }

  getBaseline(productId: string): RegressionBaseline | undefined {
    return this.baselines.get(productId);
  }

  compare(input: {
    productId: string;
    blueprint: RenderBlueprint;
    designScore: number;
    visionScore: number;
    retryCount: number;
    allowHashChange?: boolean;
  }): RegressionComparison {
    const baseline = this.baselines.get(input.productId);
    const hash = computeBlueprintChecksum(input.blueprint);
    const issues: string[] = [];

    if (!baseline) {
      this.setBaseline({
        productId: input.productId,
        blueprintHash: hash,
        designScore: input.designScore,
        visionScore: input.visionScore,
        retryCount: input.retryCount,
        constraintRevision: input.blueprint.constraints.set?.revision ?? 0,
      });
      return {
        productId: input.productId,
        passed: true,
        hashMatch: true,
        designScoreDelta: 0,
        visionScoreDelta: 0,
        retryCountDelta: 0,
        issues: ["baseline created"],
      };
    }

    const hashMatch = baseline.blueprintHash === hash;
    if (!hashMatch && !input.allowHashChange) {
      issues.push(`Blueprint hash changed: ${baseline.blueprintHash} → ${hash}`);
    }

    const designScoreDelta = input.designScore - baseline.designScore;
    const visionScoreDelta = input.visionScore - baseline.visionScore;
    const retryCountDelta = input.retryCount - baseline.retryCount;

    if (designScoreDelta < -5) {
      issues.push(`Design score regressed by ${Math.abs(designScoreDelta)}`);
    }
    if (visionScoreDelta < -5) {
      issues.push(`Vision score regressed by ${Math.abs(visionScoreDelta)}`);
    }
    if (retryCountDelta > 2) {
      issues.push(`Retry count increased by ${retryCountDelta}`);
    }

    return {
      productId: input.productId,
      passed: issues.length === 0,
      hashMatch,
      designScoreDelta,
      visionScoreDelta,
      retryCountDelta,
      issues,
    };
  }
}

export function captureBlueprintBaseline(
  productId: string,
  blueprint: RenderBlueprint,
  scores: { designScore: number; visionScore: number; retryCount: number },
): RegressionBaseline {
  return {
    productId,
    blueprintHash: computeBlueprintChecksum(blueprint),
    designScore: scores.designScore,
    visionScore: scores.visionScore,
    retryCount: scores.retryCount,
    constraintRevision: blueprint.constraints.set?.revision ?? 0,
  };
}
