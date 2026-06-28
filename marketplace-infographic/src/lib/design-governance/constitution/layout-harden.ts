import type { LayoutSpec } from "@/lib/design/layout-spec";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Marketplace-safe layout defaults before layout_spec constitution */
export function hardenLayoutSpecForConstitution(spec: LayoutSpec): LayoutSpec {
  const secondaryWeight =
    spec.visualWeightMap.headline + spec.visualWeightMap.benefits + spec.visualWeightMap.cta;
  const heroWeight = Math.max(spec.visualWeightMap.hero, secondaryWeight * 1.3, 45);

  return {
    ...spec,
    heroScale: clamp(spec.heroScale, 0.58, 0.7),
    whitespaceTarget: clamp(spec.whitespaceTarget < 20 ? 26 : spec.whitespaceTarget, 24, 32),
    maxSecondaryObjects: Math.min(spec.maxSecondaryObjects, 2),
    maxDecorativeObjects: 0,
    maxColors: Math.min(spec.maxColors, 4),
    visualWeightMap: {
      hero: heroWeight,
      headline: Math.min(spec.visualWeightMap.headline, 24),
      benefits: Math.min(spec.visualWeightMap.benefits, 12),
      cta: Math.min(spec.visualWeightMap.cta, 8),
      background: Math.min(spec.visualWeightMap.background, 10),
    },
    hierarchy: spec.hierarchy ?? {
      headline: "H1",
      hero: "H2",
      benefits: "H3",
      cta: "H3",
      decorative: "H3",
    },
  };
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
