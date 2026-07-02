/**
 * Design AI Operating System — Chapter registry (platforms 1–11)
 * Each chapter is a whole platform, not a subsection of v18 render-blueprint.
 */

export const DESIGN_AI_OS_VERSION = "1.0.0";

export type OsChapterId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type OsPlatformDefinition = {
  chapter: OsChapterId;
  id: string;
  contractId: string;
  version: string;
  label: string;
  branchSuffix: string;
  mediatorChapter?: OsChapterId;
  downstreamChapters: OsChapterId[];
};

export const OS_PLATFORM_REGISTRY: readonly OsPlatformDefinition[] = [
  {
    chapter: 1,
    id: "consumer-psychology-platform",
    contractId: "design-consumer-psychology-platform",
    version: "1.0.0",
    label: "Consumer Psychology Platform",
    branchSuffix: "ch101",
    downstreamChapters: [2, 11],
  },
  {
    chapter: 2,
    id: "consumer-behavior-platform",
    contractId: "design-consumer-behavior-platform",
    version: "2.0.0",
    label: "Consumer Behavior Platform",
    branchSuffix: "ch102",
    mediatorChapter: 1,
    downstreamChapters: [3, 11],
  },
  {
    chapter: 3,
    id: "cognitive-research-platform",
    contractId: "design-cognitive-research-platform",
    version: "3.0.0",
    label: "Cognitive Research Platform",
    branchSuffix: "ch103",
    mediatorChapter: 2,
    downstreamChapters: [4, 11],
  },
  {
    chapter: 4,
    id: "market-intelligence-platform",
    contractId: "design-market-intelligence-platform",
    version: "4.0.0",
    label: "Market Intelligence Platform",
    branchSuffix: "ch104",
    mediatorChapter: 3,
    downstreamChapters: [5, 11],
  },
  {
    chapter: 5,
    id: "competitive-intelligence-platform",
    contractId: "design-competitive-intelligence-platform",
    version: "5.0.0",
    label: "Competitive Intelligence Platform",
    branchSuffix: "ch105",
    mediatorChapter: 4,
    downstreamChapters: [6, 11],
  },
  {
    chapter: 6,
    id: "marketplace-rules-platform",
    contractId: "design-marketplace-rules-platform",
    version: "6.0.0",
    label: "Marketplace Rules Platform",
    branchSuffix: "ch106",
    mediatorChapter: 5,
    downstreamChapters: [7, 11],
  },
  {
    chapter: 7,
    id: "buyer-intelligence-platform",
    contractId: "design-buyer-intelligence-platform",
    version: "7.0.0",
    label: "Buyer Intelligence Platform",
    branchSuffix: "ch107",
    mediatorChapter: 6,
    downstreamChapters: [8, 11],
  },
  {
    chapter: 8,
    id: "value-pricing-platform",
    contractId: "design-value-pricing-platform",
    version: "8.0.0",
    label: "Value & Pricing Platform",
    branchSuffix: "ch108",
    mediatorChapter: 7,
    downstreamChapters: [9, 11],
  },
  {
    chapter: 9,
    id: "commercial-strategy-platform",
    contractId: "design-commercial-strategy-platform",
    version: "9.0.0",
    label: "Commercial Strategy Platform",
    branchSuffix: "ch109",
    mediatorChapter: 8,
    downstreamChapters: [10, 11],
  },
  {
    chapter: 10,
    id: "commercial-prediction-platform",
    contractId: "design-commercial-prediction-platform",
    version: "10.0.0",
    label: "Commercial Prediction Platform",
    branchSuffix: "ch110",
    mediatorChapter: 9,
    downstreamChapters: [11],
  },
  {
    chapter: 11,
    id: "commercial-intelligence-platform",
    contractId: "design-commercial-intelligence-platform",
    version: "11.20.0",
    label: "Commercial Intelligence Platform",
    branchSuffix: "ch1120",
    mediatorChapter: 10,
    downstreamChapters: [],
  },
] as const;

export type OsPlatformContext = {
  productCategory: string;
  productName: string;
  businessGoal: string;
  marketplaceId: string;
  priceRub?: number;
  targetAudience?: string;
};

export type OsPlatformReport = {
  chapter: OsChapterId;
  contractId: string;
  version: string;
  valid: boolean;
  outputs: Record<string, unknown>;
  handoffEvent: string;
};

export function getOsPlatform(chapter: OsChapterId): OsPlatformDefinition {
  const p = OS_PLATFORM_REGISTRY.find((x) => x.chapter === chapter);
  if (!p) throw new Error(`Unknown OS chapter: ${chapter}`);
  return p;
}
