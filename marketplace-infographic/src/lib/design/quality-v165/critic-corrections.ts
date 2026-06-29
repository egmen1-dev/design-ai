import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { LayoutSpecPatch } from "@/lib/design/layout-spec/types";

export type CriticCorrection = {
  id: string;
  description: string;
  patch: LayoutSpecPatch;
};

export type CriticReviewBase = {
  score: number;
  confidence: number;
  issues: string[];
  corrections: CriticCorrection[];
  layoutSpecPatch: LayoutSpecPatch;
  approved: boolean;
};

export function buildCorrection(
  id: string,
  description: string,
  patch: LayoutSpecPatch,
): CriticCorrection {
  return { id, description, patch };
}

export function patchesFromCorrections(corrections: CriticCorrection[]): LayoutSpecPatch {
  const merged: LayoutSpecPatch = {};
  for (const c of corrections) {
    Object.assign(merged, c.patch);
    if (c.patch.heroScaleDelta) {
      merged.heroScaleDelta = (merged.heroScaleDelta ?? 0) + c.patch.heroScaleDelta;
    }
    if (c.patch.reduceObjectCount) {
      merged.reduceObjectCount = (merged.reduceObjectCount ?? 0) + c.patch.reduceObjectCount;
    }
    if (c.patch.removeDecorations) merged.removeDecorations = true;
  }
  return merged;
}

export function luxuryRegenerationPatch(): LayoutSpecPatch {
  return {
    heroScaleDelta: 0.1,
    whitespaceTarget: 30,
    removeDecorations: true,
    reduceObjectCount: 1,
    backgroundDarken: 0.1,
    headlineContrastBoost: 0.15,
    maxSecondaryObjects: 1,
  };
}
