import type { CreativeSpec } from "../../contracts/specs";
import {
  asRecord,
  asString,
  baseSpecificationFields,
  createDecisionTraceItem,
} from "./spec-adapter-utils";

const SOURCE = "creative-spec-adapter";

export function adaptCreativeSpec(input: unknown, projectId: string): CreativeSpec {
  const root = asRecord(input);
  const creative = asRecord(root.creativeConcept ?? root.creative ?? root);
  const oneThought = asRecord(root.oneThought);

  const concept =
    asString(creative.title) ??
    asString(creative.mainIdea) ??
    asString(root.concept) ??
    "Creative concept pending";

  const visualHook =
    asString(creative.visualHook) ??
    asString(root.visualHook) ??
    asString(oneThought.answer) ??
    "Visual hook pending";

  const mood =
    asString(creative.emotion) ??
    asString(root.mood) ??
    asString(creative.toneOfVoice) ??
    "neutral";

  const rejected = Array.isArray(root.rejectedConcepts)
    ? (root.rejectedConcepts as unknown[])
        .map((item) => {
          const row = asRecord(item);
          const c = asString(row.concept);
          const r = asString(row.reason);
          return c && r ? { concept: c, reason: r } : null;
        })
        .filter((x): x is { concept: string; reason: string } => x !== null)
    : undefined;

  let completeness = 0.25;
  if (concept !== "Creative concept pending") completeness += 0.35;
  if (visualHook !== "Visual hook pending") completeness += 0.25;
  if (mood !== "neutral") completeness += 0.15;

  const trace = [
    createDecisionTraceItem(
      SOURCE,
      "Adapted CreativeSpec from legacy creative director output",
      `concept="${concept.slice(0, 48)}"`,
      completeness,
    ),
  ];

  return {
    ...baseSpecificationFields(
      projectId,
      SOURCE,
      concept !== "Creative concept pending" ? "validated" : "draft",
      completeness,
      trace,
    ),
    concept,
    visualHook,
    mood,
    rejectedConcepts: rejected?.length ? rejected : undefined,
  };
}
