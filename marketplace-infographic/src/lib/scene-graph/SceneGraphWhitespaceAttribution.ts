import type { SceneGraph } from "./SceneGraph";
import { evaluateSceneGraphLaw003 } from "./SceneGraphConstitutionMirror";
import {
  LAW003_MAX_WHITESPACE_PCT,
  LAW003_OVERLAY_DENSITY_SAFE,
} from "@/lib/daos/governance/law003-recalibration";

export type WhitespacePrimaryCause =
  | "product_too_small"
  | "overlay_too_small"
  | "wide_product_geometry_limit"
  | "background_too_empty"
  | "hero_text_ratio_low"
  | "metric_mismatch"
  | "unknown";

export type SceneGraphWhitespaceAttributionResult = {
  estimatedWhitespace: number;
  productAreaRatio: number;
  overlayDensity: number;
  textAreaRatio: number;
  badgeAreaRatio: number;
  heroTextRatio: number;
  backgroundEmptyAreaEstimate: number;
  aspectRatio: number;
  law003Failed: boolean;
  primaryCause: WhitespacePrimaryCause;
  secondaryCauses: WhitespacePrimaryCause[];
  recommendations: string[];
  confidence: number;
};

export type SceneGraphWhitespaceAttributionSummary = {
  primaryCause: WhitespacePrimaryCause;
  secondaryCauses: WhitespacePrimaryCause[];
  recommendations: string[];
  confidence: number;
  estimatedWhitespace: number;
  productAreaRatio: number;
  overlayDensity: number;
  heroTextRatio: number;
  summary: string;
};

const PRODUCT_SMALL_THRESHOLD = 0.25;
const WIDE_ASPECT_THRESHOLD = 2.0;
const LOW_OVERLAY_DENSITY = 0.12;
const HIGH_WHITESPACE_PCT = 45;
const HERO_TEXT_MIN = 2;
const PRODUCT_GOOD_FOR_MISMATCH = 0.3;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function resolveCanvas(graph: SceneGraph) {
  return graph.canvas.actual ?? graph.canvas.planned;
}

function resolveAspectRatio(graph: SceneGraph): number {
  const actual = graph.product.actual;
  const canvas = resolveCanvas(graph);
  if (actual?.width && actual.height && actual.height > 0) {
    return actual.width / actual.height;
  }
  if (actual?.widthRatio && actual.heightRatio && actual.heightRatio > 0) {
    const w = actual.widthRatio * canvas.width;
    const h = actual.heightRatio * canvas.height;
    return h > 0 ? w / h : 1;
  }
  const planned = graph.product.planned;
  if (planned?.width && planned.height && planned.height > 0) {
    return planned.width / planned.height;
  }
  return 1;
}

function resolveTextAreaRatio(graph: SceneGraph): number {
  const textAreaPct = graph.typography.actual?.textAreaPct;
  if (textAreaPct != null) return clamp01(textAreaPct / 100);

  const canvas = resolveCanvas(graph);
  const typography = graph.typography.actual ?? graph.typography.planned;
  if (typography?.width && typography.height && canvas.width && canvas.height) {
    return clamp01((typography.width * typography.height) / (canvas.width * canvas.height));
  }

  const productAreaPct = graph.composition.actual?.productAreaPct ?? 0;
  return clamp01(Math.max(productAreaPct * 0.2, 1) / 100);
}

function resolveBadgeAreaRatio(graph: SceneGraph): number {
  const overlayArea = graph.overlay.actual?.actualArea;
  const textAreaRatio = resolveTextAreaRatio(graph);
  if (overlayArea != null && overlayArea > 0) {
    return clamp01(Math.max(0, overlayArea - textAreaRatio));
  }

  const badgeCount = graph.badges.actual?.count ?? 0;
  if (badgeCount > 0) {
    return clamp01(badgeCount * 0.02);
  }
  return 0;
}

function resolveHeroTextRatio(graph: SceneGraph, productAreaRatio: number): number {
  const productAreaPct =
    graph.composition.actual?.productAreaPct ?? productAreaRatio * 100;
  const textAreaPct = graph.typography.actual?.textAreaPct ?? Math.max(productAreaPct * 0.2, 1);
  return productAreaPct / Math.max(textAreaPct, 1);
}

function estimateBackgroundEmptyArea(
  estimatedWhitespace: number,
  productAreaRatio: number,
  overlayDensity: number,
  textAreaRatio: number,
  badgeAreaRatio: number,
): number {
  const fromWhitespace = clamp01(estimatedWhitespace / 100);
  const occupied = productAreaRatio + overlayDensity + textAreaRatio + badgeAreaRatio;
  const residual = clamp01(1 - occupied);
  return clamp01(Math.max(fromWhitespace, residual));
}

function isWideProduct(aspectRatio: number, graph: SceneGraph): boolean {
  if (aspectRatio >= WIDE_ASPECT_THRESHOLD) return true;
  const category = (graph.metadata.productCategory ?? "").toLowerCase();
  return /mattress|матрас|диван|кровать|ковёр|ковер|стол|furniture|мебель/.test(category);
}

type CauseCandidate = { cause: WhitespacePrimaryCause; priority: number };

function collectCauseCandidates(input: {
  law003Failed: boolean;
  estimatedWhitespace: number;
  productAreaRatio: number;
  overlayDensity: number;
  heroTextRatio: number;
  aspectRatio: number;
  isWide: boolean;
}): CauseCandidate[] {
  const causes: CauseCandidate[] = [];
  if (!input.law003Failed) return causes;

  if (
    input.productAreaRatio >= PRODUCT_GOOD_FOR_MISMATCH &&
    input.overlayDensity <= LAW003_OVERLAY_DENSITY_SAFE &&
    input.estimatedWhitespace > LAW003_MAX_WHITESPACE_PCT
  ) {
    causes.push({ cause: "metric_mismatch", priority: 100 });
  }

  if (input.isWide && input.productAreaRatio < PRODUCT_SMALL_THRESHOLD) {
    causes.push({ cause: "wide_product_geometry_limit", priority: 90 });
  } else if (input.productAreaRatio < PRODUCT_SMALL_THRESHOLD) {
    causes.push({ cause: "product_too_small", priority: 80 });
  }

  if (input.heroTextRatio < HERO_TEXT_MIN) {
    causes.push({ cause: "hero_text_ratio_low", priority: 70 });
  }

  if (input.overlayDensity < LOW_OVERLAY_DENSITY && input.estimatedWhitespace > HIGH_WHITESPACE_PCT) {
    causes.push({ cause: "overlay_too_small", priority: 60 });
    causes.push({ cause: "background_too_empty", priority: 55 });
  } else if (input.estimatedWhitespace > HIGH_WHITESPACE_PCT) {
    causes.push({ cause: "background_too_empty", priority: 50 });
  }

  if (!causes.length) {
    causes.push({ cause: "unknown", priority: 10 });
  }

  return causes;
}

function buildRecommendations(input: {
  primaryCause: WhitespacePrimaryCause;
  secondaryCauses: WhitespacePrimaryCause[];
  isWide: boolean;
  heroTextRatio: number;
  productAreaRatio: number;
  overlayDensity: number;
  estimatedWhitespace: number;
}): string[] {
  const recommendations: string[] = [];
  const allCauses = new Set([input.primaryCause, ...input.secondaryCauses]);

  if (allCauses.has("metric_mismatch")) {
    recommendations.push(
      "Review LAW_003 whitespace formula — product and overlay look adequate but estimated whitespace still fails",
    );
  }

  if (allCauses.has("wide_product_geometry_limit") || (input.isWide && input.heroTextRatio < HERO_TEXT_MIN)) {
    recommendations.push("Use wide-product layout template; avoid hero scale patch for wide geometry");
  } else if (allCauses.has("product_too_small")) {
    recommendations.push("Increase product scale or adjust compositor placement to raise hero fill");
  }

  if (allCauses.has("overlay_too_small")) {
    recommendations.push("Add overlay elements or increase typography/badge footprint to reduce empty canvas");
  }

  if (allCauses.has("background_too_empty")) {
    recommendations.push("Reduce background empty area with tighter crop, content fill, or scene props");
  }

  if (allCauses.has("hero_text_ratio_low") && !input.isWide) {
    recommendations.push("Reduce text area or enlarge hero product to improve hero/text contrast hierarchy");
  } else if (allCauses.has("hero_text_ratio_low") && input.isWide) {
    recommendations.push("Apply wide-product typography band; do not compensate with hero scale patch");
  }

  if (!recommendations.length && input.estimatedWhitespace > LAW003_MAX_WHITESPACE_PCT) {
    recommendations.push("Investigate SceneGraph whitespace drift between planned and actual composition");
  }

  return [...new Set(recommendations)];
}

function computeConfidence(input: {
  law003Failed: boolean;
  primaryCause: WhitespacePrimaryCause;
  secondaryCauses: WhitespacePrimaryCause[];
  productSourceActual: boolean;
  whitespaceSourceActual: boolean;
}): number {
  if (!input.law003Failed) return 0.4;

  let confidence = 0.55;
  if (input.productSourceActual) confidence += 0.15;
  if (input.whitespaceSourceActual) confidence += 0.1;
  if (input.primaryCause !== "unknown") confidence += 0.1;
  if (input.secondaryCauses.length > 0) confidence += 0.05;
  if (input.primaryCause === "metric_mismatch") confidence += 0.05;
  return Math.min(0.95, Math.round(confidence * 100) / 100);
}

/** Attribute LAW_003 whitespace failure to root causes from SceneGraph nodes. */
export function analyzeSceneGraphWhitespaceAttribution(
  graph: SceneGraph,
): SceneGraphWhitespaceAttributionResult {
  const law003 = evaluateSceneGraphLaw003(graph);
  const estimatedWhitespace = law003.estimatedWhitespace;
  const productAreaRatio = law003.productAreaRatio;
  const overlayDensity = law003.overlayDensity;
  const textAreaRatio = resolveTextAreaRatio(graph);
  const badgeAreaRatio = resolveBadgeAreaRatio(graph);
  const aspectRatio = resolveAspectRatio(graph);
  const heroTextRatio = resolveHeroTextRatio(graph, productAreaRatio);
  const backgroundEmptyAreaEstimate = estimateBackgroundEmptyArea(
    estimatedWhitespace,
    productAreaRatio,
    overlayDensity,
    textAreaRatio,
    badgeAreaRatio,
  );
  const isWide = isWideProduct(aspectRatio, graph);
  const law003Failed = !law003.passed;

  const candidates = collectCauseCandidates({
    law003Failed,
    estimatedWhitespace,
    productAreaRatio,
    overlayDensity,
    heroTextRatio,
    aspectRatio,
    isWide,
  });

  candidates.sort((a, b) => b.priority - a.priority);
  const primaryCause = law003Failed ? (candidates[0]?.cause ?? "unknown") : "unknown";
  const secondaryCauses = law003Failed
    ? [...new Set(candidates.slice(1).map((c) => c.cause).filter((c) => c !== primaryCause))]
    : [];

  const recommendations = law003Failed
    ? buildRecommendations({
        primaryCause,
        secondaryCauses,
        isWide,
        heroTextRatio,
        productAreaRatio,
        overlayDensity,
        estimatedWhitespace,
      })
    : [];

  const confidence = computeConfidence({
    law003Failed,
    primaryCause,
    secondaryCauses,
    productSourceActual: law003.source === "actual" || law003.source === "mixed",
    whitespaceSourceActual: graph.whitespace.actual?.whitespacePct != null,
  });

  return {
    estimatedWhitespace,
    productAreaRatio,
    overlayDensity,
    textAreaRatio,
    badgeAreaRatio,
    heroTextRatio,
    backgroundEmptyAreaEstimate,
    aspectRatio,
    law003Failed,
    primaryCause,
    secondaryCauses,
    recommendations,
    confidence,
  };
}

/** Compact summary for debug bundle and logs. */
export function summarizeSceneGraphWhitespaceAttribution(
  result: SceneGraphWhitespaceAttributionResult,
): SceneGraphWhitespaceAttributionSummary {
  const summary = result.law003Failed
    ? `LAW_003 fail → ${result.primaryCause} (ws=${result.estimatedWhitespace.toFixed(1)}%, product=${(result.productAreaRatio * 100).toFixed(1)}%, overlay=${result.overlayDensity.toFixed(2)})`
    : `LAW_003 pass (ws=${result.estimatedWhitespace.toFixed(1)}%)`;

  return {
    primaryCause: result.primaryCause,
    secondaryCauses: result.secondaryCauses,
    recommendations: result.recommendations,
    confidence: result.confidence,
    estimatedWhitespace: result.estimatedWhitespace,
    productAreaRatio: result.productAreaRatio,
    overlayDensity: result.overlayDensity,
    heroTextRatio: result.heroTextRatio,
    summary,
  };
}
