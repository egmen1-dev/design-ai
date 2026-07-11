import type { CommercialDecisionBeta } from "../types";
import { clampReachableTarget } from "../product-area-targets";
import { getCategoryProfile } from "./profiles";
import { resolveCategoryIntelligenceKey } from "./resolve-category-key";
import type { CategoryIntelligenceResult } from "./types";
import { CATEGORY_INTELLIGENCE_VERSION } from "./types";

export function applyCategoryIntelligence(input: {
  decision: CommercialDecisionBeta;
  productTitle?: string;
  category?: string;
}): {
  decision: CommercialDecisionBeta;
  intelligence: CategoryIntelligenceResult;
} {
  const key = resolveCategoryIntelligenceKey({
    productTitle: input.productTitle,
    category: input.category,
  });

  if (!key) {
    return {
      decision: input.decision,
      intelligence: {
        version: CATEGORY_INTELLIGENCE_VERSION,
        enabled: true,
        key: null,
        label: null,
        profile: null,
        appliedOverrides: [],
        trace: ["categoryIntelligence: no wave-1 match"],
      },
    };
  }

  const profile = getCategoryProfile(key);
  const appliedOverrides: string[] = [];
  const trace: string[] = [
    `categoryIntelligence: matched key=${key} label=${profile.label}`,
    `categoryIntelligence: laws=${profile.commercialLaws.join(",")}`,
    `categoryIntelligence: visualPattern=${profile.visualPattern}`,
  ];

  const decision: CommercialDecisionBeta = { ...input.decision };

  const productArea = clampReachableTarget(profile.compositionRules.productAreaTarget);
  if (productArea !== decision.productAreaTarget) {
    decision.productAreaTarget = productArea;
    appliedOverrides.push(`productAreaTarget=${productArea}`);
    trace.push(`override productAreaTarget=${productArea}`);
  }

  if (profile.compositionRules.maxCharacteristics !== decision.maxCharacteristics) {
    decision.maxCharacteristics = profile.compositionRules.maxCharacteristics;
    appliedOverrides.push(`maxCharacteristics=${profile.compositionRules.maxCharacteristics}`);
  }

  if (profile.compositionRules.badgeLimit !== decision.badgeLimit) {
    decision.badgeLimit = profile.compositionRules.badgeLimit;
    appliedOverrides.push(`badgeLimit=${profile.compositionRules.badgeLimit}`);
  }

  decision.visualHierarchy = [...profile.compositionRules.visualHierarchy];
  appliedOverrides.push(`visualHierarchy=${profile.compositionRules.visualHierarchy.join(">")}`);

  if (profile.lightingRules.environmentDirection) {
    decision.environmentDirection = profile.lightingRules.environmentDirection;
    appliedOverrides.push(`environment=${profile.lightingRules.environmentDirection}`);
    trace.push(`override environment=${profile.lightingRules.environmentDirection}`);
  }

  decision.backgroundContrastDirection = profile.backgroundRules.contrastDirection;
  appliedOverrides.push(`backgroundContrast=${profile.backgroundRules.contrastDirection}`);

  decision.typographyDirection = profile.typographyRules.direction;
  appliedOverrides.push(`typography=${profile.typographyRules.direction}`);

  const title = input.productTitle?.trim();
  if (title) {
    decision.mainMessage = `Результат с ${title}: ${profile.heroRules.mainMessageSuffix}`;
  }

  const mergedAnti = [...new Set([...decision.antiRules, ...profile.antiRules])];
  decision.antiRules = mergedAnti;
  appliedOverrides.push(`antiRules+=${profile.antiRules.length}`);

  decision.decisionTrace = [
    ...decision.decisionTrace,
    ...trace,
    `categoryIntelligence: lighting contrastBoost=${profile.lightingRules.contrastBoost}`,
    `categoryIntelligence: attention dominanceFloor=${profile.attentionRules.dominanceFloor}`,
  ];

  return {
    decision,
    intelligence: {
      version: CATEGORY_INTELLIGENCE_VERSION,
      enabled: true,
      key,
      label: profile.label,
      profile,
      appliedOverrides,
      trace,
    },
  };
}
