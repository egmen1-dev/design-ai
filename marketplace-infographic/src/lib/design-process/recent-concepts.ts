import { prisma } from "@/lib/prisma";
import { unpackSdPayload } from "@/lib/sd-stored-payload";
import {
  buildConceptFingerprint,
  type ConceptFingerprint,
} from "./concept-similarity";
import type { CreativeDirectorResult } from "./creative-concept";

/** Загружает отпечатки последних генераций пользователя для анти-шаблона */
export async function loadRecentConceptFingerprints(
  userId: string,
  limit = 5,
): Promise<ConceptFingerprint[]> {
  const rows = await prisma.generatedImage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { generatedJson: true },
  });

  const fingerprints: ConceptFingerprint[] = [];

  for (const row of rows) {
    if (!row.generatedJson) continue;
    try {
      const stored = unpackSdPayload(row.generatedJson);
      const brief = stored.brief;
      if (!brief?.creativeConcept || !brief.oneThought) continue;
      const concept: CreativeDirectorResult = {
        archetypeId: brief.selectedArchetypeId as CreativeDirectorResult["archetypeId"],
        creativeConcept: {
          title: brief.creativeConcept.title,
          mainIdea: brief.creativeConcept.mainIdea,
          visualHook: brief.creativeConcept.visualHook,
          emotion: brief.creativeConcept.emotion,
          marketingGoal: brief.creativeConcept.marketingGoal,
          reason: brief.creativeConcept.reason,
          targetAudience: brief.creativeConcept.targetAudience ?? "",
          toneOfVoice: brief.creativeConcept.toneOfVoice ?? "",
          styleKeywords: brief.creativeConcept.styleKeywords ?? [],
          whatToSayInOneSecond: brief.creativeConcept.whatToSayInOneSecond ?? "",
        },
        oneThought: brief.oneThought,
        sceneNarrative: brief.sceneNarrative ?? "",
        compositionScenarioId: brief.compositionScenarioId as CreativeDirectorResult["compositionScenarioId"],
      };
      fingerprints.push(buildConceptFingerprint(concept));
    } catch {
      // skip corrupt payloads
    }
  }

  return fingerprints;
}
