import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";

export const TREND_INTELLIGENCE_VERSION = "1.0";
export const TREND_SYNC_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

export type TrendSignal = {
  id: string;
  label: string;
  category: KnowledgeCategory | "global";
  strength: number;
  direction: "rising" | "stable" | "declining";
};

export type ColorTrend = {
  name: string;
  primary: string;
  accent: string;
  emotion: string;
  marketplaceScore: number;
};

export type FontTrend = {
  family: string;
  tags: string[];
  visualImpact: number;
};

export type CompositionTrend = {
  layoutTemplate: string;
  productScalePct: number;
  negativeSpacePct: number;
  score: number;
};

export type TrendIntelligenceContext = {
  category: KnowledgeCategory;
  version: number;
  promptBlock: string;
  agentSnippet: string;
  styleSignals: TrendSignal[];
  colorTrends: ColorTrend[];
  fontTrends: FontTrend[];
  compositionTrends: CompositionTrend[];
  risingLayouts: string[];
  decliningLayouts: string[];
  trendScore: number;
};

export const GLOBAL_STYLE_SIGNALS: TrendSignal[] = [
  { id: "glass_badges", label: "Glass badges", category: "global", strength: 0.82, direction: "rising" },
  { id: "warm_lifestyle", label: "Warm lifestyle scenes", category: "global", strength: 0.78, direction: "rising" },
  { id: "low_angle_hero", label: "Low-angle hero product", category: "global", strength: 0.74, direction: "rising" },
  { id: "minimal_text", label: "Minimal text density", category: "global", strength: 0.8, direction: "rising" },
  { id: "white_bg_decline", label: "Pure white backgrounds", category: "global", strength: 0.35, direction: "declining" },
  { id: "flat_infographic", label: "Flat infographic panels", category: "global", strength: 0.28, direction: "declining" },
];

export const CATEGORY_COLOR_TRENDS: Partial<Record<KnowledgeCategory, ColorTrend[]>> = {
  generator: [
    { name: "Blue Orange Trust", primary: "#1e3a5f", accent: "#f97316", emotion: "reliability", marketplaceScore: 92 },
    { name: "Industrial Steel", primary: "#334155", accent: "#eab308", emotion: "power", marketplaceScore: 88 },
  ],
  generic: [
    { name: "Marketplace Blue", primary: "#2563eb", accent: "#f97316", emotion: "trust", marketplaceScore: 85 },
  ],
};

export const CATEGORY_COMPOSITION_TRENDS: Partial<Record<KnowledgeCategory, CompositionTrend[]>> = {
  generator: [
    { layoutTemplate: "hero_right", productScalePct: 68, negativeSpacePct: 21, score: 94 },
    { layoutTemplate: "commercial", productScalePct: 66, negativeSpacePct: 22, score: 91 },
  ],
  generic: [
    { layoutTemplate: "hero_left", productScalePct: 65, negativeSpacePct: 24, score: 86 },
    { layoutTemplate: "minimal", productScalePct: 67, negativeSpacePct: 26, score: 84 },
  ],
};
