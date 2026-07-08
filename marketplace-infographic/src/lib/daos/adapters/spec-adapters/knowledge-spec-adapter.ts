import type { KnowledgeSpec } from "../../contracts/specs";
import {
  asRecord,
  asString,
  asStringArray,
  baseSpecificationFields,
  createDecisionTraceItem,
} from "./spec-adapter-utils";

const SOURCE = "knowledge-spec-adapter";

export function adaptKnowledgeSpec(input: unknown, projectId: string): KnowledgeSpec {
  const root = asRecord(input);
  const knowledge = asRecord(root.knowledge ?? root);
  const market = asRecord(root.market);
  const genome = asRecord(root.genome);

  const patterns = asStringArray(knowledge.patterns).length
    ? asStringArray(knowledge.patterns)
    : Array.isArray(knowledge.patterns)
      ? (knowledge.patterns as unknown[])
          .map((p) => {
            const row = asRecord(p);
            return asString(row.patternKey) ?? asString(row.id) ?? asString(row.name);
          })
          .filter((s): s is string => Boolean(s))
      : [];

  const designGenome = asStringArray(genome.rankings).length
    ? asStringArray(genome.rankings)
    : asString(genome.genomeKey)
      ? [asString(genome.genomeKey)!]
      : [];

  const marketplaceRules = [
    ...asStringArray(market.opportunities),
    asString(market.agentSnippet),
    asString(knowledge.promptBlock),
  ].filter((s): s is string => Boolean(s));

  let completeness = 0.25;
  if (patterns.length > 0) completeness += 0.35;
  if (asString(knowledge.category)) completeness += 0.15;
  if (marketplaceRules.length > 0) completeness += 0.15;
  if (designGenome.length > 0) completeness += 0.1;

  const trace = [
    createDecisionTraceItem(
      SOURCE,
      "Adapted KnowledgeSpec from legacy knowledge context",
      patterns.length
        ? `Mapped ${patterns.length} knowledge pattern(s)`
        : "No patterns in legacy input — empty KnowledgeSpec shell",
      completeness,
      [
        asString(knowledge.category) ? `category:${knowledge.category}` : undefined,
        patterns.length ? `patterns:${patterns.length}` : undefined,
      ].filter((s): s is string => Boolean(s)),
    ),
  ];

  return {
    ...baseSpecificationFields(
      projectId,
      SOURCE,
      patterns.length ? "validated" : "draft",
      completeness,
      trace,
    ),
    patterns,
    designGenome: designGenome.length ? designGenome : undefined,
    marketplaceRules: marketplaceRules.length ? marketplaceRules.slice(0, 12) : undefined,
  };
}
