import type { LayoutTemplateId } from "@/lib/layout-engine/types";
import { pickAllowedEnvironment } from "@/lib/layout-engine/background-categories";
import type { ProductCategory } from "@/lib/product-analysis";
import { resolveCoverConcept, type CoverConceptId } from "@/lib/cover-concepts";
import type { ChiefDesignDirectorPlan } from "./types";

export type FixApplicationHints = {
  needsLayoutRetry: boolean;
  needsBackgroundRetry: boolean;
  preferTemplateId?: LayoutTemplateId;
  backgroundEnvironment?: string;
  simplifyCardMeaning: boolean;
};

/** Из плана Chief Director — подсказки для handler retry */
export function deriveFixApplicationHints(
  plan: ChiefDesignDirectorPlan,
  category: ProductCategory,
  productPrompt: string,
  seed: string,
  options?: {
    coverConceptId?: CoverConceptId;
    coverConceptUserSelected?: boolean;
  },
): FixApplicationHints {
  const hasCritical = (actions: ChiefDesignDirectorPlan["layoutChanges"]) =>
    actions.some((a) => a.priority === "critical");

  const needsLayoutRetry =
    hasCritical(plan.layoutChanges) ||
    hasCritical(plan.productChanges) ||
    hasCritical(plan.badgeChanges) ||
    hasCritical(plan.compositionChanges);

  const needsBackgroundRetry = hasCritical(plan.backgroundChanges);

  let preferTemplateId: LayoutTemplateId | undefined;
  if (plan.layoutChanges.some((a) => /minimal/i.test(a.action))) {
    preferTemplateId = "minimal";
  } else if (plan.layoutChanges.some((a) => /premium/i.test(a.action))) {
    preferTemplateId = "premium";
  }

  const backgroundEnvironment = needsBackgroundRetry
    ? options?.coverConceptUserSelected && options.coverConceptId
      ? resolveCoverConcept(options.coverConceptId).backgroundPromptSuffix
      : pickAllowedEnvironment(category, productPrompt, seed)
    : undefined;

  const simplifyCardMeaning = plan.compositionChanges.some((a) =>
    /скрыть subtitle|title \+ feature/i.test(a.action),
  );

  return {
    needsLayoutRetry,
    needsBackgroundRetry,
    preferTemplateId,
    backgroundEnvironment,
    simplifyCardMeaning,
  };
}
