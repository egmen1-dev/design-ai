import type { CardMeaning } from "@/lib/layout-engine/types";
import type { LayoutTemplateId } from "@/lib/layout-engine/types";
import { COMPOSITION_TEMPLATES } from "@/lib/design/composition-director";
import {
  LAYOUT_SPEC_DEFAULTS,
  type LayoutSpec,
  type LayoutSpecPatch,
} from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function applyLayoutSpecPatch(spec: LayoutSpec, patch: LayoutSpecPatch): LayoutSpec {
  let heroScale = patch.heroScale ?? spec.heroScale;
  if (patch.heroScaleDelta) {
    heroScale = clamp(heroScale * (1 + patch.heroScaleDelta), 0.52, 0.78);
  }

  let whitespaceTarget = patch.whitespaceTarget ?? spec.whitespaceTarget;
  if (patch.reduceObjectCount) {
    whitespaceTarget = clamp(whitespaceTarget + patch.reduceObjectCount * 3, 20, 38);
  }

  let maxSecondaryObjects = patch.maxSecondaryObjects ?? spec.maxSecondaryObjects;
  if (patch.removeDecorations) {
    maxSecondaryObjects = Math.min(maxSecondaryObjects, 1);
  }
  if (patch.reduceObjectCount) {
    maxSecondaryObjects = Math.max(0, maxSecondaryObjects - patch.reduceObjectCount);
  }

  const visualWeightMap = { ...spec.visualWeightMap, ...patch.visualWeightMap };
  if (patch.heroScaleDelta) {
    visualWeightMap.hero = clamp(visualWeightMap.hero + patch.heroScaleDelta * 100, 35, 60);
    visualWeightMap.background = clamp(visualWeightMap.background - 5, 3, 20);
  }
  if (patch.backgroundDarken) {
    visualWeightMap.background = clamp(visualWeightMap.background - patch.backgroundDarken * 15, 2, 15);
  }
  if (patch.headlineContrastBoost) {
    visualWeightMap.headline = clamp(visualWeightMap.headline + patch.headlineContrastBoost * 12, 18, 40);
  }

  let backgroundStyle = patch.backgroundStyle ?? spec.backgroundStyle;
  if (patch.backgroundDarken && patch.backgroundDarken >= 0.15) {
    backgroundStyle = "dark_premium";
  }

  return {
    ...spec,
    ...patch,
    heroScale,
    whitespaceTarget,
    maxSecondaryObjects,
    maxIcons: patch.maxIcons ?? spec.maxIcons,
    maxColors: patch.maxColors ?? spec.maxColors,
    palette: patch.palette ?? spec.palette,
    backgroundStyle,
    visualWeightMap,
  };
}

export function mergeLayoutSpecPatches(...patches: LayoutSpecPatch[]): LayoutSpecPatch {
  const merged: LayoutSpecPatch = {};
  for (const p of patches) {
    Object.assign(merged, p);
    if (p.heroScaleDelta) {
      merged.heroScaleDelta = (merged.heroScaleDelta ?? 0) + p.heroScaleDelta;
    }
    if (p.backgroundDarken) {
      merged.backgroundDarken = Math.max(merged.backgroundDarken ?? 0, p.backgroundDarken);
    }
    if (p.headlineContrastBoost) {
      merged.headlineContrastBoost = Math.max(merged.headlineContrastBoost ?? 0, p.headlineContrastBoost);
    }
    if (p.reduceObjectCount) {
      merged.reduceObjectCount = (merged.reduceObjectCount ?? 0) + p.reduceObjectCount;
    }
    if (p.removeDecorations) merged.removeDecorations = true;
    if (p.visualWeightMap) {
      merged.visualWeightMap = { ...merged.visualWeightMap, ...p.visualWeightMap };
    }
  }
  return merged;
}

export function layoutSpecToTemplatePreference(spec: LayoutSpec): LayoutTemplateId | undefined {
  if (spec.compositionTemplateId) {
    return COMPOSITION_TEMPLATES[spec.compositionTemplateId].layoutEngineTemplate;
  }
  if (spec.heroPosition === "left") return "hero_left";
  if (spec.heroPosition === "center") return "minimal";
  if (spec.backgroundStyle === "dark_premium") return "luxury";
  if (spec.whitespaceTarget >= 30) return "premium";
  return spec.heroScale >= 0.68 ? "hero_right" : "commercial";
}

export function simplifyCardMeaningForSpec(
  meaning: CardMeaning,
  spec: LayoutSpec,
): CardMeaning {
  let feature = meaning.feature;
  let badge = meaning.badge;
  let subtitle = meaning.subtitle;

  const secondary = (feature ? 1 : 0) + (badge ? 1 : 0) + (subtitle ? 1 : 0);
  if (secondary > spec.maxSecondaryObjects) {
    if (subtitle) subtitle = "";
    if (secondary > spec.maxSecondaryObjects && badge && feature) badge = "";
  }

  return { ...meaning, feature, badge, subtitle };
}

export function resetLayoutSpec(): LayoutSpec {
  return { ...LAYOUT_SPEC_DEFAULTS, palette: [...LAYOUT_SPEC_DEFAULTS.palette] };
}
