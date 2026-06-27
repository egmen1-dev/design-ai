import type { ConstitutionSetId } from "../types";
import { ALL_LAWS } from "../laws";

export type ConstitutionSetDefinition = {
  id: ConstitutionSetId;
  version: string;
  label: string;
  description: string;
  lawIds: string[];
};

export const CONSTITUTION_SETS: Record<ConstitutionSetId, ConstitutionSetDefinition> = {
  core_v1: {
    id: "core_v1",
    version: "1.0",
    label: "Constitution v1.0",
    description: "Universal marketplace design laws",
    lawIds: ALL_LAWS.filter((l) => l.sets.includes("core_v1")).map((l) => l.id),
  },
  marketplace_v1: {
    id: "marketplace_v1",
    version: "1.2",
    label: "Marketplace Constitution v1.2",
    description: "Wildberries / Ozon cover optimization laws",
    lawIds: ALL_LAWS.filter((l) => l.sets.includes("marketplace_v1")).map((l) => l.id),
  },
  luxury_v2: {
    id: "luxury_v2",
    version: "2.0",
    label: "Luxury Constitution v2.0",
    description: "Premium editorial restraint",
    lawIds: ALL_LAWS.map((l) => l.id),
  },
  industrial_dna: {
    id: "industrial_dna",
    version: "1.0",
    label: "Industrial DNA Constitution",
    description: "Tools, construction, auto categories",
    lawIds: [
      "LAW_001",
      "LAW_002",
      "LAW_003",
      "LAW_004",
      "LAW_005",
      "LAW_006",
      "LAW_009",
      "LAW_010",
      "LAW_012",
      "LAW_014",
    ],
  },
  beauty_dna: {
    id: "beauty_dna",
    version: "1.0",
    label: "Beauty DNA Constitution",
    description: "Cosmetics and fashion categories",
    lawIds: [
      "LAW_001",
      "LAW_002",
      "LAW_003",
      "LAW_004",
      "LAW_006",
      "LAW_007",
      "LAW_008",
      "LAW_010",
      "LAW_015",
    ],
  },
  electronics_dna: {
    id: "electronics_dna",
    version: "1.0",
    label: "Electronics DNA Constitution",
    description: "Tech product showcase laws",
    lawIds: [
      "LAW_001",
      "LAW_002",
      "LAW_003",
      "LAW_004",
      "LAW_005",
      "LAW_009",
      "LAW_010",
      "LAW_011",
      "LAW_014",
    ],
  },
};

export function resolveConstitutionSet(input: {
  category?: string;
  priceSegment?: string;
}): ConstitutionSetId {
  if (input.priceSegment === "premium") return "luxury_v2";
  const cat = input.category ?? "generic";
  if (cat === "electronics") return "electronics_dna";
  if (cat === "cosmetics" || cat === "fashion") return "beauty_dna";
  if (cat === "garden_tools" || cat === "construction" || cat === "auto" || cat === "sport") {
    return "industrial_dna";
  }
  return "marketplace_v1";
}

export function lawsForSet(setId: ConstitutionSetId) {
  const def = CONSTITUTION_SETS[setId];
  return ALL_LAWS.filter((l) => def.lawIds.includes(l.id));
}
