import type { CompositionScenarioId } from "@/lib/design/types";
import type { DesignDNA } from "@/lib/design/types";
import type { VisualHook, VisualHookType } from "./types";

const HOOK_DNA_BIAS: Partial<Record<VisualHookType, Partial<DesignDNA>>> = {
  oversized_product: { productDominance: 88, negativeSpace: 24, visualEnergy: 62 },
  premium_badge: { luxury: 85, minimalism: 72, decorDensity: 10, contrast: 75 },
  emotional_background: { depth: 82, colorMood: 78, productDominance: 58, lightingDrama: 70 },
  dynamic_diagonal: { visualEnergy: 78, symmetry: 32, contrast: 72 },
  spec_highlight: { textDensity: 38, contrast: 75, productDominance: 62 },
  luxury_minimal: { luxury: 90, minimalism: 88, decorDensity: 6, negativeSpace: 32 },
  lifestyle_scene: { depth: 75, colorMood: 70, lightingDrama: 65 },
  tech_showcase: { contrast: 80, visualEnergy: 70, depth: 72, typographyWeight: 78 },
  gift_bundle: { decorDensity: 28, visualEnergy: 65, textDensity: 30 },
  contrast_pop: { contrast: 92, visualEnergy: 72, colorMood: 68 },
  editorial_typography: { typographyWeight: 85, minimalism: 75, textDensity: 32 },
  power_number: { textDensity: 35, contrast: 78, productDominance: 65 },
};

const HOOK_SCENARIO_BOOST: Partial<Record<VisualHookType, CompositionScenarioId[]>> = {
  oversized_product: ["focus_frame", "hero_product"],
  premium_badge: ["luxury_advertising", "minimal_premium"],
  emotional_background: ["lifestyle", "floating_product"],
  dynamic_diagonal: ["dynamic_diagonal", "asymmetric"],
  spec_highlight: ["split_layout", "commercial_studio"],
  luxury_minimal: ["minimal_premium", "editorial"],
  lifestyle_scene: ["lifestyle", "floating_product"],
  tech_showcase: ["tech_showcase", "commercial_studio"],
  gift_bundle: ["split_layout", "hero_product"],
  contrast_pop: ["asymmetric", "dynamic_diagonal"],
  editorial_typography: ["editorial", "minimal_premium"],
  power_number: ["split_layout", "focus_frame"],
};

function normalizeHookType(type: string): VisualHookType | null {
  const key = type.toLowerCase().replace(/[\s-]+/g, "_") as VisualHookType;
  return key in HOOK_DNA_BIAS ? key : null;
}

export function applyVisualHookToDna(dna: DesignDNA, hook?: VisualHook): DesignDNA {
  if (!hook) return dna;
  const normalized = normalizeHookType(hook.type);
  const bias = normalized ? HOOK_DNA_BIAS[normalized] : undefined;
  if (!bias) {
    const confidenceBoost = Math.round((hook.confidence - 50) / 10);
    return {
      ...dna,
      visualEnergy: Math.min(100, dna.visualEnergy + confidenceBoost),
      contrast: Math.min(100, dna.contrast + Math.round(confidenceBoost / 2)),
    };
  }

  const weight = Math.min(1, hook.confidence / 100);
  const blended = { ...dna };
  for (const [key, value] of Object.entries(bias) as Array<[keyof DesignDNA, number]>) {
    blended[key] = Math.round(dna[key] * (1 - weight * 0.45) + value * (weight * 0.45));
  }
  return blended;
}

export function scenarioBoostFromHook(
  hook: VisualHook | undefined,
  scenarioId: CompositionScenarioId,
): number {
  if (!hook) return 0;
  const normalized = normalizeHookType(hook.type);
  const preferred = normalized ? HOOK_SCENARIO_BOOST[normalized] : undefined;
  if (!preferred) return 0;
  const idx = preferred.indexOf(scenarioId);
  if (idx === 0) return 28 * (hook.confidence / 100);
  if (idx === 1) return 16 * (hook.confidence / 100);
  return 0;
}

export function objectScaleFromHook(hook?: VisualHook, base = 0.78): number {
  if (!hook) return base;
  const normalized = normalizeHookType(hook.type);
  if (normalized === "oversized_product") return Math.min(0.9, base + 0.08);
  if (normalized === "emotional_background" || normalized === "lifestyle_scene") return Math.max(0.55, base - 0.06);
  if (normalized === "luxury_minimal" || normalized === "editorial_typography") return Math.max(0.58, base - 0.04);
  return base;
}
