import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { LayoutSpecPatch } from "@/lib/design/layout-spec";
import { applyConstitutionLayoutPatch } from "@/lib/design/design-constitution/patches/engine";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Marketplace-safe layout defaults before layout_spec constitution */
export function hardenLayoutSpecForConstitution(spec: LayoutSpec): LayoutSpec {
  const secondaryWeight =
    spec.visualWeightMap.headline + spec.visualWeightMap.benefits + spec.visualWeightMap.cta;
  const heroWeight = Math.max(spec.visualWeightMap.hero, secondaryWeight * 1.35, 48);

  return {
    ...spec,
    heroScale: clamp(spec.heroScale, 0.58, 0.68),
    whitespaceTarget: clamp(spec.whitespaceTarget < 20 ? 28 : spec.whitespaceTarget, 26, 32),
    maxSecondaryObjects: Math.min(spec.maxSecondaryObjects, 2),
    maxDecorativeObjects: 0,
    maxColors: Math.min(spec.maxColors, 4),
    visualWeightMap: {
      hero: heroWeight,
      headline: Math.min(spec.visualWeightMap.headline, 22),
      benefits: Math.min(spec.visualWeightMap.benefits, 10),
      cta: Math.min(spec.visualWeightMap.cta, 7),
      background: Math.min(spec.visualWeightMap.background, 8),
    },
    hierarchy: spec.hierarchy ?? {
      headline: "H1",
      hero: "hero",
      benefits: "supporting",
      cta: "cta",
      decorative: "decorative",
    },
  };
}

const LAYOUT_ESCALATION_PATCHES: LayoutSpecPatch[] = [
  { heroScaleDelta: 0.05, whitespaceTarget: 28, removeDecorations: true, reduceObjectCount: 1 },
  { heroScaleDelta: 0.04, headlineContrastBoost: 0.1, backgroundDarken: 0.05 },
  { heroScaleDelta: 0.03, whitespaceTarget: 27, reduceObjectCount: 1, maxSecondaryObjects: 1 },
  { headlineContrastBoost: 0.12, heroScaleDelta: 0.02, backgroundDarken: 0.06 },
];

/** Stronger corrections when score plateaus below threshold */
export function escalateLayoutSpec(spec: LayoutSpec, round: number): LayoutSpec {
  let next = hardenLayoutSpecForConstitution(spec);
  const patchIndex = Math.min(round, LAYOUT_ESCALATION_PATCHES.length - 1);
  for (let i = 0; i <= patchIndex; i++) {
    next = hardenLayoutSpecForConstitution(
      applyConstitutionLayoutPatch(next, LAYOUT_ESCALATION_PATCHES[i]),
    );
  }
  return next;
}

export const LAYOUT_HARD_LAW_IDS = new Set(["LAW_001", "LAW_002", "LAW_003"]);

export function layoutPassesHardLaws(layoutSpec: LayoutSpec): boolean {
  const hero = layoutSpec.visualWeightMap.hero;
  const secondary =
    layoutSpec.visualWeightMap.headline +
    layoutSpec.visualWeightMap.benefits +
    layoutSpec.visualWeightMap.cta;
  const heroScalePct = layoutSpec.heroScale * 100;
  const ws = layoutSpec.whitespaceTarget;

  const law001 =
    hero >= secondary * 1.2 && (layoutSpec.maxSecondaryObjects ?? 2) <= 3;
  const law002 = heroScalePct >= 55 && heroScalePct <= 75;
  const law003 = ws >= 20 && ws <= 35;

  return law001 && law002 && law003;
}
