import type { CommercialSpec } from "../../contracts/specs";
import {
  asRecord,
  asString,
  asStringArray,
  baseSpecificationFields,
  createDecisionTraceItem,
} from "./spec-adapter-utils";

const SOURCE = "commercial-spec-adapter";

export function adaptCommercialSpec(input: unknown, projectId: string): CommercialSpec {
  const root = asRecord(input);
  const brief = asRecord(root.designBrief ?? root.brief);
  const creative = asRecord(brief.creativeConcept);
  const oneThought = asRecord(brief.oneThought);
  const seniorAd = asRecord(root.seniorAdReview);
  const ctr = asRecord(root.ctrReview);
  const market = asRecord(root.marketIntelligence);

  const mainMessage =
    asString(oneThought.headline) ??
    asString(creative.mainIdea) ??
    asString(creative.title) ??
    asString(root.mainMessage) ??
    "Commercial message pending";

  const usp = [
    asString(creative.visualHook),
    asString(creative.whatToSayInOneSecond),
    asString(creative.marketingGoal),
    ...asStringArray(creative.styleKeywords),
  ].filter((s, i, arr): s is string => Boolean(s) && arr.indexOf(s) === i);

  const weaknesses = Array.isArray(market.weaknesses)
    ? (market.weaknesses as unknown[])
        .map((w) => asString(asRecord(w).issue) ?? asString(asRecord(w).pattern))
        .filter((s): s is string => Boolean(s))
    : [];

  const buyerPainPoints =
    weaknesses.length > 0
      ? weaknesses
      : asStringArray(root.buyerPainPoints).length
        ? asStringArray(root.buyerPainPoints)
        : ["Market pain points not extracted in Wave 2"];

  const trustDrivers = [
    seniorAd.approved === true ? "senior_art_director_approved" : undefined,
    ctr.wouldClick === true ? "ctr_expert_would_click" : undefined,
    asString(ctr.recommendation),
    asString(seniorAd.summary),
  ].filter((s): s is string => Boolean(s));

  const hierarchy = [
    asString(oneThought.headline),
    asString(oneThought.badge),
    asString(creative.title),
  ].filter((s): s is string => Boolean(s));

  let completeness = 0.3;
  if (mainMessage !== "Commercial message pending") completeness += 0.25;
  if (usp.length > 0) completeness += 0.2;
  if (trustDrivers.length > 0) completeness += 0.15;
  if (hierarchy.length > 0) completeness += 0.1;

  const trace = [
    createDecisionTraceItem(
      SOURCE,
      "Adapted CommercialSpec from legacy commercial intelligence",
      `mainMessage from ${asString(oneThought.headline) ? "oneThought" : asString(creative.mainIdea) ? "creativeConcept" : "fallback"}`,
      completeness,
      [
        seniorAd.score != null ? `seniorAdScore:${seniorAd.score}` : undefined,
        ctr.ctrPrediction != null ? `ctrPrediction:${ctr.ctrPrediction}` : undefined,
      ].filter((s): s is string => Boolean(s)),
    ),
  ];

  return {
    ...baseSpecificationFields(
      projectId,
      SOURCE,
      trustDrivers.length ? "validated" : "draft",
      completeness,
      trace,
    ),
    mainMessage,
    usp: usp.length ? usp : ["USP pending"],
    buyerPainPoints,
    trustDrivers: trustDrivers.length ? trustDrivers : ["Trust signals pending"],
    hierarchy: hierarchy.length ? hierarchy : ["headline", "badge", "support"],
  };
}
