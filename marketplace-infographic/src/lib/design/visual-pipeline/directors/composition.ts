import type { LayoutSpec } from "@/lib/design/layout-spec/types";
import type { CompositionDecision, DirectorResult } from "../types";
import type { HeroPosition } from "@/lib/design/scene-blueprint/types";

export type CompositionDecisionInput = {
  layoutSpec?: LayoutSpec;
  heroPositionHint?: HeroPosition;
};

export function runCompositionDecisionDirector(
  input: CompositionDecisionInput,
): DirectorResult<CompositionDecision> {
  const spec = input.layoutSpec;
  const heroX = spec?.geometry?.hero
    ? spec.geometry.hero.x + spec.geometry.hero.width / 2
    : 0.72;

  const heroPosition: HeroPosition =
    input.heroPositionHint ??
    (heroX < 0.42 ? "bottom-left" : heroX > 0.58 ? "bottom-right" : "center");

  const negativeSpace: CompositionDecision["negativeSpace"] =
    heroPosition.includes("right") ? "left" : heroPosition.includes("left") ? "right" : "balanced";

  const decision: CompositionDecision = {
    heroPosition,
    negativeSpace,
    balance:
      heroPosition === "bottom-right"
        ? "asymmetric_hero_right"
        : heroPosition === "bottom-left"
          ? "asymmetric_hero_left"
          : "centered",
    visualWeight: {
      hero: spec?.visualWeightMap?.hero ?? 46,
      background: spec?.visualWeightMap?.background ?? 10,
      headline: spec?.visualWeightMap?.headline ?? 22,
    },
    safeZones: spec?.geometry
      ? [
          {
            purpose: "headline",
            left: spec.geometry.headline.x,
            top: spec.geometry.headline.y,
            width: spec.geometry.headline.width,
            height: spec.geometry.headline.height,
          },
          {
            purpose: "product",
            left: spec.geometry.hero.x,
            top: spec.geometry.hero.y,
            width: spec.geometry.hero.width,
            height: spec.geometry.hero.height,
          },
        ]
      : [],
  };

  return {
    decision,
    approved: true,
    score: 80,
    agentSnippet: `Comp:${decision.balance} space:${negativeSpace}`,
  };
}
