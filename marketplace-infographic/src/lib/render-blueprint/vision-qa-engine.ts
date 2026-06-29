/**
 * Chapter 3.18 — Vision Quality Assurance engine
 * Analyzes final composite image only — no prompt, blueprint, or decision graph.
 */
import {
  VISION_THRESHOLDS,
  type VisionInput,
  type VisionReport,
  type VisionImageSignals,
} from "./vision-qa-types";
import { deriveVisionSignals } from "./vision-qa-signals";
import {
  analyzeVisionSignals,
  passesVisionThresholds,
  visionConfidence,
} from "./vision-qa-analysis";
import { recommendationsFromIssues } from "./vision-qa-recovery";
import { VisionHistoryStore } from "./vision-qa-history";

export {
  VisionCategory,
  IssueSeverity,
  VISION_THRESHOLDS,
  VISION_METRIC_WEIGHTS,
  type VisionInput,
  type VisionReport,
  type VisionMetrics,
  type VisionQAIssue,
  type VisionRecommendation,
  type VisionCategoryId,
  type IssueSeverityId,
  type VisionImageSignals,
  type VisionHistoryEntry,
  type BoundingBox,
} from "./vision-qa-types";

export { deriveVisionSignals, hashVisionImage, parseImageDimensions } from "./vision-qa-signals";
export {
  analyzeVisionSignals,
  passesVisionThresholds,
  weightedOverall,
  visionConfidence,
} from "./vision-qa-analysis";
export { recommendationsFromIssues } from "./vision-qa-recovery";
export { VisionHistoryStore } from "./vision-qa-history";

export class VisionQAError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VisionQAError";
  }
}

export type VisionQAOptions = {
  /** Optional plugin signals (OpenCV / ML) — must not include blueprint data */
  signals?: Partial<VisionImageSignals>;
  recordHistory?: boolean;
  history?: VisionHistoryStore;
};

export class VisionQA {
  private readonly history: VisionHistoryStore;

  constructor(history?: VisionHistoryStore) {
    this.history = history ?? new VisionHistoryStore();
  }

  getHistory(): VisionHistoryStore {
    return this.history;
  }

  /**
   * Analyze composite image — provider-agnostic.
   * Uses only VisionInput fields (image, mask, metadata, provider).
   */
  analyze(input: VisionInput, options: VisionQAOptions = {}): VisionReport {
    if (!input.image?.trim()) {
      throw new VisionQAError("VisionInput.image is required");
    }

    const derived = deriveVisionSignals(input.image, input.productMask);
    const signals: VisionImageSignals = { ...derived, ...options.signals };

    const { issues, metrics } = analyzeVisionSignals(signals);
    const recommendations = recommendationsFromIssues(issues);
    const approved = passesVisionThresholds(metrics) && !issues.some((i) => i.severity === "critical");
    const confidence = visionConfidence(metrics, issues.length);

    const report: VisionReport = {
      approved,
      score: metrics.overall,
      confidence,
      issues,
      metrics,
      recommendations,
      provider: input.provider,
      analyzedAt: Date.now(),
    };

    if (options.recordHistory !== false) {
      const store = options.history ?? this.history;
      store.record(input.image, report);
    }

    return report;
  }
}

/** Default singleton for pipeline integration */
export const defaultVisionQA = new VisionQA();

export function analyzeVision(input: VisionInput, options?: VisionQAOptions): VisionReport {
  return defaultVisionQA.analyze(input, options);
}
