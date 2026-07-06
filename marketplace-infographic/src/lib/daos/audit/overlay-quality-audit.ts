import type { ConstitutionReport } from "@/lib/design/design-constitution";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { FinalQualityScore } from "@/lib/design/final-quality-validator";
import type { QualityValidationResult } from "@/lib/design/quality-validator";
import type { ComposerQualityAudit } from "./composer-quality-audit";
import type { ComposerOverlayElement } from "./composer-quality-audit";
import type { Law003RecalibrationReport } from "../governance/law003-recalibration";
import {
  resolveLaw003SoftGovernance,
  type Law003GovernanceSource,
} from "../governance/law003-soft-governance";
import type { ContrastOverlapPatch } from "../overlay/contrast-overlap-patch";
import type { SceneGraphProductActual } from "@/lib/scene-graph/product-actual-bridge";
import {
  isDaosSceneGraphOverlayUsesActual,
  resolveOverlayProductBbox,
  countTextZoneOverlapsWithProduct,
} from "@/lib/scene-graph/product-actual-bridge";
import type { CompositionLayout } from "@/lib/composition/types";

export const LAW014_CONTRAST_OVERLAP_PASS_THRESHOLD = 0.16;

export type OverlayQualityWarning = {
  code: string;
  message: string;
};

export type OverlayHtmlTemplateData = {
  headline?: string;
  subtitle?: string;
  bullets?: string[];
  badge?: boolean;
  plaques?: number;
  logo?: boolean;
  layout?: string;
};

export type OverlayDiagnosticReport = {
  qualityValidation?: QualityValidationResult;
  finalQuality?: FinalQualityScore;
  constitution?: ConstitutionReport[];
};

export type OverlayQualityAuditInput = {
  canvas?: { width: number; height: number };
  overlayElements?: ComposerOverlayElement[] | "unknown";
  layoutSpec?: LayoutSpec;
  htmlTemplateData?: OverlayHtmlTemplateData;
  diagnosticReport?: OverlayDiagnosticReport;
  governanceReport?: ConstitutionReport[];
  composerQualityAudit?: ComposerQualityAudit;
  compositionMetrics?: {
    textAreaPct?: number;
    plaqueAreaPct?: number;
    whitespacePct?: number;
    overlapPct?: number;
  };
  hasComposite?: boolean;
  law003Recalibration?: Pick<
    Law003RecalibrationReport,
    "law003After" | "law003Before" | "reason" | "warnings" | "staleMetricDetected"
  >;
  law003SoftGovernanceEnabled?: boolean;
  factualProductAreaRatio?: number;
  contrastOverlapPatch?: Pick<ContrastOverlapPatch, "applied" | "contrastOverlapAfterEstimate">;
  sceneGraphProductActual?: SceneGraphProductActual;
  compositionLayout?: CompositionLayout;
};

export type OverlayQualityAudit = {
  overlayElementCount: number;
  estimatedOverlayDensity: number;
  whitespaceRisk: number;
  contrastRisk: number;
  hierarchyRisk: number;
  readabilityRisk: number;
  pngOverlayFeelRisk: number;
  law003WhitespaceViolation: boolean;
  law014ContrastViolation: boolean;
  law003Before: boolean;
  law003After: boolean;
  law003GovernanceSource: Law003GovernanceSource;
  law003SoftResolved: boolean;
  law003StillFailingReason?: string;
  overlayUsedSceneGraphActual?: boolean;
  overlayProductActualSource?: string;
  overlayProductActualAreaRatio?: number;
  overlayAvoidedActualProductOverlap?: boolean;
  warnings: OverlayQualityWarning[];
  recommendations: string[];
  score: number;
};

export type OverlayQualityAuditSummary = {
  score: number;
  overlayDensity: number;
  pngOverlayFeelRisk: number;
  law003WhitespaceViolation: boolean;
  law014ContrastViolation: boolean;
  law003Before: boolean;
  law003After: boolean;
  law003GovernanceSource: Law003GovernanceSource;
  law003SoftResolved: boolean;
  law003StillFailingReason?: string;
  warningCodes: string[];
  notes: string[];
};

const DENSITY_THRESHOLD = 0.45;
const MAX_OVERLAY_ELEMENTS = 6;
const WHITESPACE_TARGET_MAX = 35;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function governanceReports(input: OverlayQualityAuditInput): ConstitutionReport[] {
  return input.governanceReport ?? input.diagnosticReport?.constitution ?? [];
}

function lawViolated(reports: ConstitutionReport[], lawId: string): boolean {
  for (const report of reports) {
    for (const entry of report.entries ?? []) {
      if (entry.lawId === lawId && entry.passed === false) return true;
    }
    for (const violation of report.violations ?? []) {
      const id = (violation as { lawId?: string }).lawId;
      if (id === lawId) return true;
    }
  }
  return false;
}

function countOverlayElements(input: OverlayQualityAuditInput): number {
  if (input.overlayElements === "unknown") {
    return countFromTemplateData(input.htmlTemplateData, input.layoutSpec);
  }

  if (Array.isArray(input.overlayElements) && input.overlayElements.length > 0) {
    return input.overlayElements.length;
  }

  return countFromTemplateData(input.htmlTemplateData, input.layoutSpec);
}

function countFromTemplateData(
  template?: OverlayHtmlTemplateData,
  layoutSpec?: LayoutSpec,
): number {
  let count = 0;
  if (template?.headline?.trim()) count += 1;
  if (template?.subtitle?.trim()) count += 1;
  if (template?.badge) count += 1;
  if (template?.logo) count += 1;
  count += template?.bullets?.filter(Boolean).length ?? 0;
  count += template?.plaques ?? 0;

  if (layoutSpec) {
    if (layoutSpec.benefitsArea !== "none") count += 1;
    if (layoutSpec.ctaArea !== "none") count += 1;
    count += Math.min(layoutSpec.maxIcons ?? 0, 3);
    count += Math.min(layoutSpec.maxSecondaryObjects ?? 0, 2);
  }

  return count;
}

function estimateOverlayDensity(input: OverlayQualityAuditInput): number {
  const metrics = input.compositionMetrics;
  if (metrics) {
    const text = (metrics.textAreaPct ?? 0) / 100;
    const plaques = (metrics.plaqueAreaPct ?? 0) / 100;
    const overlap = (metrics.overlapPct ?? 0) / 100;
    return clamp01(text + plaques + overlap * 0.5);
  }

  if (input.overlayElements !== "unknown" && Array.isArray(input.overlayElements)) {
    const total = input.overlayElements
      .map((element) => element.areaPct ?? 0)
      .reduce((sum, value) => sum + value, 0);
    if (total > 0) return clamp01(total);
  }

  if (input.layoutSpec?.visualWeightMap) {
    const { headline, benefits, cta } = input.layoutSpec.visualWeightMap;
    return clamp01((headline + benefits + cta) / 100);
  }

  return 0;
}

function resolveLaw003Governance(input: OverlayQualityAuditInput) {
  const constitutionLaw003 = lawViolated(governanceReports(input), "LAW_003");
  return resolveLaw003SoftGovernance({
    constitutionViolation: constitutionLaw003,
    recalibration: input.law003Recalibration,
    softGovernanceEnabled: input.law003SoftGovernanceEnabled,
    factualProductAreaRatio: input.factualProductAreaRatio,
    overlayDensity: input.compositionMetrics
      ? estimateOverlayDensity(input)
      : undefined,
  });
}

function computeWhitespaceRisk(
  input: OverlayQualityAuditInput,
  law003Governance: ReturnType<typeof resolveLaw003Governance>,
): number {
  let risk = 0.2;
  const whitespacePct = input.compositionMetrics?.whitespacePct;
  const target = input.layoutSpec?.whitespaceTarget ?? WHITESPACE_TARGET_MAX;

  if (typeof whitespacePct === "number") {
    if (whitespacePct > WHITESPACE_TARGET_MAX) risk += 0.45;
    else if (whitespacePct > target) risk += 0.25;
    else if (whitespacePct < 18) risk += 0.15;
  }

  const constitutionLaw003 = lawViolated(governanceReports(input), "LAW_003");
  const law003Active = law003Governance.softViolation;

  if (law003Active) {
    risk += 0.35;
  } else if (constitutionLaw003 && law003Governance.law003SoftResolved) {
    risk = Math.max(0.1, risk - 0.2);
  }

  return clamp01(risk);
}

function computeContrastRisk(input: OverlayQualityAuditInput): number {
  let risk = 0.2;
  const overlap = input.compositionMetrics?.overlapPct ?? 0;
  if (overlap >= 5) risk += 0.35;
  else if (overlap >= 3) risk += 0.2;

  if (isDaosSceneGraphOverlayUsesActual() && input.sceneGraphProductActual && input.compositionLayout) {
    const productBbox = resolveOverlayProductBbox({
      canvas: input.canvas ?? input.compositionLayout.canvas,
      sceneGraphProductActual: input.sceneGraphProductActual,
      preferSceneGraphActual: true,
    });
    const factualOverlaps = countTextZoneOverlapsWithProduct(input.compositionLayout, productBbox);
    if (factualOverlaps >= 2) risk += 0.35;
    else if (factualOverlaps === 1) risk += 0.2;
    else if (factualOverlaps === 0 && overlap >= 3) {
      risk = Math.max(0.1, risk - 0.15);
    }
  }

  if (lawViolated(governanceReports(input), "LAW_014")) {
    risk += 0.4;
  }

  return clamp01(risk);
}

function computeHierarchyRisk(input: OverlayQualityAuditInput): number {
  const hierarchy = input.layoutSpec?.hierarchy;
  if (!hierarchy) return 0.65;

  const levels = Object.values(hierarchy);
  if (!levels.length) return 0.65;
  if (levels.every((level) => level === "tertiary" || level === "hidden")) return 0.55;
  return 0.15;
}

function computeReadabilityRisk(input: OverlayQualityAuditInput): number {
  const finalQuality = input.diagnosticReport?.finalQuality;
  if (!finalQuality) return 0.35;

  let risk = 0.15;
  if (finalQuality.instantComprehension < 90) risk += 0.25;
  if (finalQuality.notOverloaded < 90) risk += 0.2;
  if (finalQuality.issues.includes("slow_comprehension")) risk += 0.2;
  if (finalQuality.issues.includes("overloaded")) risk += 0.2;

  return clamp01(risk);
}

function computePngOverlayFeelRisk(input: OverlayQualityAuditInput): number {
  let risk = 0.2;
  const finalQuality = input.diagnosticReport?.finalQuality;

  if (finalQuality?.issues.includes("png_overlay_feel")) risk += 0.45;
  if (finalQuality?.notPngOverlay != null && finalQuality.notPngOverlay < 90) {
    risk += 0.25;
  }
  if (input.hasComposite === false) risk += 0.3;

  if (isDaosSceneGraphOverlayUsesActual() && input.sceneGraphProductActual && input.compositionLayout) {
    const productBbox = resolveOverlayProductBbox({
      canvas: input.canvas ?? input.compositionLayout.canvas,
      sceneGraphProductActual: input.sceneGraphProductActual,
      preferSceneGraphActual: true,
    });
    const factualOverlaps = countTextZoneOverlapsWithProduct(input.compositionLayout, productBbox);
    if (factualOverlaps > 0) risk += 0.2;
    else risk = Math.max(0.1, risk - 0.1);
  }

  const composerRisk = input.composerQualityAudit?.finalCompositionRisk ?? 0;
  if (composerRisk > 0.4) {
    risk += (composerRisk - 0.4) * 0.8;
  }

  return clamp01(risk);
}

function computeScore(input: {
  overlayElementCount: number;
  estimatedOverlayDensity: number;
  whitespaceRisk: number;
  contrastRisk: number;
  hierarchyRisk: number;
  readabilityRisk: number;
  pngOverlayFeelRisk: number;
  law003WhitespaceViolation: boolean;
  law014ContrastViolation: boolean;
  warnings: OverlayQualityWarning[];
}): number {
  let score = 100;

  if (input.overlayElementCount > MAX_OVERLAY_ELEMENTS) score -= 10;
  if (input.estimatedOverlayDensity > DENSITY_THRESHOLD) score -= 15;
  if (input.law003WhitespaceViolation) score -= 12;
  if (input.law014ContrastViolation) score -= 12;
  if (input.hierarchyRisk >= 0.55) score -= 8;

  score -= input.whitespaceRisk * 15;
  score -= input.contrastRisk * 15;
  score -= input.readabilityRisk * 10;
  score -= input.pngOverlayFeelRisk * 20;
  score -= input.warnings.length * 5;

  return clampScore(score);
}

/** Deterministic overlay/HTML quality audit from layout and governance metadata. */
export function analyzeOverlayQuality(input: OverlayQualityAuditInput): OverlayQualityAudit {
  const warnings: OverlayQualityWarning[] = [];
  const recommendations = new Set<string>();

  const overlayElementCount = countOverlayElements(input);
  const estimatedOverlayDensity = estimateOverlayDensity(input);
  const constitutionLaw003 = lawViolated(governanceReports(input), "LAW_003");
  const law003Governance = resolveLaw003Governance(input);
  const law003WhitespaceViolation = law003Governance.softViolation;
  const constitutionLaw014 = lawViolated(governanceReports(input), "LAW_014");
  let law014ContrastViolation = input.contrastOverlapPatch?.applied
    ? input.contrastOverlapPatch.contrastOverlapAfterEstimate >
      LAW014_CONTRAST_OVERLAP_PASS_THRESHOLD
    : constitutionLaw014;

  if (
    isDaosSceneGraphOverlayUsesActual() &&
    input.sceneGraphProductActual &&
    input.compositionLayout &&
    constitutionLaw014
  ) {
    const productBbox = resolveOverlayProductBbox({
      canvas: input.canvas ?? input.compositionLayout.canvas,
      sceneGraphProductActual: input.sceneGraphProductActual,
      preferSceneGraphActual: true,
    });
    const factualOverlaps = countTextZoneOverlapsWithProduct(input.compositionLayout, productBbox);
    if (factualOverlaps === 0) {
      law014ContrastViolation = false;
    }
  }

  const usedSceneGraphActual =
    isDaosSceneGraphOverlayUsesActual() && Boolean(input.sceneGraphProductActual);
  const whitespaceRisk = computeWhitespaceRisk(input, law003Governance);
  const contrastRisk = computeContrastRisk(input);
  const hierarchyRisk = computeHierarchyRisk(input);
  const readabilityRisk = computeReadabilityRisk(input);
  const pngOverlayFeelRisk = computePngOverlayFeelRisk(input);

  if (overlayElementCount > MAX_OVERLAY_ELEMENTS) {
    warnings.push({
      code: "OVERLAY_ELEMENT_COUNT_HIGH",
      message: `Overlay element count ${overlayElementCount} exceeds recommended maximum ${MAX_OVERLAY_ELEMENTS}`,
    });
    recommendations.add("Reduce secondary overlays, badges, or bullet blocks on the final card.");
  }

  if (estimatedOverlayDensity > DENSITY_THRESHOLD) {
    warnings.push({
      code: "OVERLAY_DENSITY_HIGH",
      message: `Estimated overlay density ${estimatedOverlayDensity.toFixed(2)} exceeds ${DENSITY_THRESHOLD}`,
    });
    recommendations.add("Lower text/plaque area or increase whitespace before HTML render.");
  }

  if (law003WhitespaceViolation) {
    warnings.push({
      code: "LAW_003_WHITESPACE_VIOLATION",
      message: "Design governance reported LAW_003 whitespace violation",
    });
    recommendations.add("Apply whitespace patch from constitution critique before shipping.");
  } else if (law003Governance.law003SoftResolved) {
    warnings.push({
      code: "LAW_003_RECALIBRATED_PASS",
      message: "LAW_003 passed after factual composite product area recalibration",
    });
  }

  if (input.law003Recalibration?.staleMetricDetected) {
    warnings.push({
      code: "STALE_WHITESPACE_METRIC",
      message: "Planned whitespace metric lags factual composite product area",
    });
  }

  if (law014ContrastViolation) {
    warnings.push({
      code: "LAW_014_CONTRAST_VIOLATION",
      message: "Design governance reported LAW_014 contrast violation",
    });
    recommendations.add("Reduce text/product overlap and improve headline contrast.");
  } else if (constitutionLaw014 && input.contrastOverlapPatch?.applied) {
    warnings.push({
      code: "LAW_014_PATCH_PASS",
      message: "LAW_014 passed after contrast/overlap patch recalibration",
    });
  } else if (constitutionLaw014 && usedSceneGraphActual && !law014ContrastViolation) {
    warnings.push({
      code: "LAW_014_SCENE_GRAPH_SOFT_PASS",
      message: "LAW_014 passed after factual scene-graph product bbox overlap check",
    });
  }

  if (!input.layoutSpec?.hierarchy) {
    warnings.push({
      code: "OVERLAY_HIERARCHY_UNKNOWN",
      message: "Layout hierarchy metadata is missing for overlay audit",
    });
    recommendations.add("Capture layoutSpec.hierarchy in debug bundle for overlay traceability.");
  }

  if (input.overlayElements === "unknown") {
    warnings.push({
      code: "OVERLAY_ELEMENTS_UNKNOWN",
      message: "Overlay elements could not be enumerated from layout/template metadata",
    });
  }

  if (pngOverlayFeelRisk > 0.5) {
    warnings.push({
      code: "PNG_OVERLAY_FEEL_RISK",
      message: `PNG overlay feel risk elevated (${pngOverlayFeelRisk.toFixed(2)})`,
    });
    recommendations.add("Improve composite integration (shadow/contact) before HTML overlays.");
  }

  if (recommendations.size === 0) {
    recommendations.add("Overlay metadata looks within expected guardrails.");
  }

  const score = computeScore({
    overlayElementCount,
    estimatedOverlayDensity,
    whitespaceRisk,
    contrastRisk,
    hierarchyRisk,
    readabilityRisk,
    pngOverlayFeelRisk,
    law003WhitespaceViolation,
    law014ContrastViolation,
    warnings,
  });

  return {
    overlayElementCount,
    estimatedOverlayDensity,
    whitespaceRisk,
    contrastRisk,
    hierarchyRisk,
    readabilityRisk,
    pngOverlayFeelRisk,
    law003WhitespaceViolation,
    law014ContrastViolation,
    law003Before: law003Governance.law003Before,
    law003After: law003Governance.law003After,
    law003GovernanceSource: law003Governance.law003GovernanceSource,
    law003SoftResolved: law003Governance.law003SoftResolved,
    law003StillFailingReason: law003Governance.law003StillFailingReason,
    overlayUsedSceneGraphActual: usedSceneGraphActual,
    overlayProductActualSource: usedSceneGraphActual
      ? input.sceneGraphProductActual?.source
      : undefined,
    overlayProductActualAreaRatio: usedSceneGraphActual
      ? input.sceneGraphProductActual?.areaRatio
      : undefined,
    warnings,
    recommendations: [...recommendations],
    score,
  };
}

/** Compact overlay audit summary for diagnostics and benchmark export. */
export function summarizeOverlayQualityAudit(
  audit: OverlayQualityAudit,
): OverlayQualityAuditSummary {
  return {
    score: audit.score,
    overlayDensity: audit.estimatedOverlayDensity,
    pngOverlayFeelRisk: audit.pngOverlayFeelRisk,
    law003WhitespaceViolation: audit.law003WhitespaceViolation,
    law014ContrastViolation: audit.law014ContrastViolation,
    law003Before: audit.law003Before,
    law003After: audit.law003After,
    law003GovernanceSource: audit.law003GovernanceSource,
    law003SoftResolved: audit.law003SoftResolved,
    law003StillFailingReason: audit.law003StillFailingReason,
    warningCodes: audit.warnings.map((warning) => warning.code),
    notes: [
      `overlayElementCount=${audit.overlayElementCount}`,
      `whitespaceRisk=${audit.whitespaceRisk.toFixed(2)}`,
      `contrastRisk=${audit.contrastRisk.toFixed(2)}`,
      `hierarchyRisk=${audit.hierarchyRisk.toFixed(2)}`,
    ],
  };
}
