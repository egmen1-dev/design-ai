import type { LayoutSpec } from "@/lib/design/layout-spec/types";
import { LAYOUT_SPEC_DEFAULTS } from "@/lib/design/layout-spec/types";
import type {
  CompositionConstraints,
  CompositionDirectorInput,
  CompositionDirectorResult,
  CompositionQuality,
  LayoutGeometry,
  NormalizedVisualWeight,
} from "./types";
import { COMPOSITION_PASS_THRESHOLD } from "./types";
import { COMPOSITION_TEMPLATES, resolveCompositionTemplate } from "./templates";
import {
  applyGeometryPatch,
  buildGeometryFromTemplate,
  computeVisualWeight,
  computeWhitespaceRatio,
  enforceCompositionRules,
} from "./geometry";
import { scoreEyeFlow } from "./eye-flow";
import { scoreVisualBalance } from "./balance";
import { scoreWhitespace } from "./whitespace";
import { DEFAULT_HIERARCHY, scoreHierarchy } from "./hierarchy";

const MAX_ATTEMPTS = 2;

function geometryToLegacySpec(
  geometry: LayoutGeometry,
  weight: NormalizedVisualWeight,
  template: CompositionConstraints,
  palette?: string[],
): LayoutSpec {
  const wsRaw = Math.round(computeWhitespaceRatio(geometry) * 100);
  const ws = Math.max(20, Math.min(35, wsRaw));
  const heroCenterX = geometry.hero.x + geometry.hero.width / 2;

  return {
    ...LAYOUT_SPEC_DEFAULTS,
    compositionTemplateId: template.id,
    geometry,
    visualWeight: weight,
    hierarchy: DEFAULT_HIERARCHY,
    heroPosition:
      heroCenterX < 0.42 ? "left" : heroCenterX > 0.58 ? "right" : "center",
    heroScale: Math.min(0.78, Math.max(0.52, geometry.hero.width * geometry.hero.height * 2)),
    headlineArea: geometry.headline.x < 0.4 ? "left" : "right",
    benefitsArea: geometry.benefits.height > 0.05 ? "left_panel" : "none",
    ctaArea: geometry.cta.height > 0.03 ? "badge_under_title" : "none",
    whitespaceTarget: ws,
    maxIcons: 1,
    maxSecondaryObjects: template.maxSecondaryObjects,
    maxDecorativeObjects: template.maxDecorativeObjects,
    maxColors: 4,
    palette: palette?.slice(0, 4) ?? LAYOUT_SPEC_DEFAULTS.palette,
    backgroundStyle: LAYOUT_SPEC_DEFAULTS.backgroundStyle,
    lightingStyle: LAYOUT_SPEC_DEFAULTS.lightingStyle,
    visualWeightMap: {
      hero: Math.round(weight.hero * 100),
      headline: Math.round(weight.headline * 100),
      benefits: Math.round(weight.benefits * 100),
      cta: Math.round(weight.cta * 100),
      background: Math.round(weight.background * 100),
    },
  };
}

function evaluateQuality(
  geometry: LayoutGeometry,
  weight: NormalizedVisualWeight,
  template: CompositionConstraints,
): CompositionQuality {
  const eyeFlow = scoreEyeFlow(geometry);
  const balance = scoreVisualBalance(geometry);
  const whitespace = scoreWhitespace(geometry, template.whitespaceTarget);
  const hierarchyScore = scoreHierarchy(geometry, weight);

  const total = Math.round(
    eyeFlow.score * 0.22 +
      balance.score * 0.2 +
      whitespace.score * 0.22 +
      hierarchyScore * 0.2 +
      (weight.background <= 0.12 ? 16 : 8),
  );

  const issues = [
    ...eyeFlow.penalties,
    ...(balance.passed ? [] : ["Visual balance imbalance"]),
    ...(whitespace.passed ? [] : ["Whitespace crowded or insufficient"]),
    ...(hierarchyScore >= 75 ? [] : ["Weak visual hierarchy"]),
  ];

  return {
    eyeFlow,
    balance,
    whitespace,
    hierarchyScore,
    total,
    passed: total >= COMPOSITION_PASS_THRESHOLD && eyeFlow.passed && whitespace.passed,
    issues,
  };
}

function applyCorrections(
  geometry: LayoutGeometry,
  quality: CompositionQuality,
): LayoutGeometry {
  let g = geometry;
  for (const patch of [
    ...quality.eyeFlow.corrections,
    ...quality.balance.corrections,
    ...quality.whitespace.corrections,
  ]) {
    g = applyGeometryPatch(g, patch);
  }
  return enforceCompositionRules(g);
}

/**
 * Composition Director — spatial decisions ONLY, never prompts.
 * Single source of truth for layout geometry before Prompt Builder.
 */
export async function runCompositionDirector(
  input: CompositionDirectorInput,
): Promise<CompositionDirectorResult> {
  const templateId = resolveCompositionTemplate({
    category: input.analysis.category,
    priceSegment: input.analysis.priceSegment,
    sceneType: input.sceneBlueprint?.scene.type,
    genomeTemplateId: input.genomeTemplateId,
  });
  const template = COMPOSITION_TEMPLATES[templateId];
  const seed = input.seed ?? "comp";

  let geometry = enforceCompositionRules(
    buildGeometryFromTemplate(template, seed),
  );
  let weight = computeVisualWeight(geometry);
  let quality = evaluateQuality(geometry, weight, template);
  let attempts = 1;

  while (!quality.passed && attempts < MAX_ATTEMPTS) {
    geometry = applyCorrections(geometry, quality);
    weight = computeVisualWeight(geometry);
    quality = evaluateQuality(geometry, weight, template);
    attempts++;
  }

  const layoutSpec = geometryToLegacySpec(geometry, weight, template, input.palette);

  return {
    layoutSpec,
    templateId,
    quality,
    approved: quality.passed,
    attempts,
    agentSnippet: `Comp:${templateId} Q:${quality.total} EF:${quality.eyeFlow.score}`,
    source: attempts > 1 ? "corrected" : "template",
  };
}
