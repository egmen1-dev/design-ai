import type { ProductCategory } from "@/lib/product-analysis";
import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";

export const ASSETS_INTELLIGENCE_VERSION = "1.0";
export const ASSET_SYNC_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;
export const ASSET_DIVERSITY_WINDOW = 15;
export const ASSET_OVERUSE_THRESHOLD = 4;

export type BadgeStyleKind =
  | "glass"
  | "minimal"
  | "premium"
  | "tech"
  | "modern"
  | "soft"
  | "outline"
  | "neumorphism"
  | "brutalism";

export type ParametricBadgeModel = {
  style: BadgeStyleKind;
  radius: number;
  paddingX: number;
  paddingY: number;
  borderWidth: number;
  shadow: "none" | "soft" | "medium" | "hard";
  gradient: string;
  opacity: number;
  cornerStyle: "rounded" | "pill" | "sharp";
  stretchMode: "center" | "fit" | "expand";
  iconPosition: "left" | "right" | "none";
  adaptive: boolean;
  borderColor?: string;
  fillColor?: string;
  textColor?: string;
};

export type FontStyleTag =
  | "Modern"
  | "Minimal"
  | "Premium"
  | "Luxury"
  | "Industrial"
  | "Technology"
  | "Kids"
  | "Fashion"
  | "Medical"
  | "Friendly"
  | "Corporate"
  | "Bold"
  | "Soft"
  | "Marketplace";

export type FontIntelligenceProfile = {
  family: string;
  tags: FontStyleTag[];
  marketplaceReadability: number;
  visualImpact: number;
  successScore: number;
  categories: string[];
};

export type PaletteModel = {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  contrast: number;
  premiumScore: number;
  marketplaceScore: number;
  emotion: string;
  categories: string[];
};

export type ShapeStyleModel = {
  name: string;
  radius: number;
  borderWidth: number;
  depth: number;
  gradient: boolean;
  shadow: string;
  glass: boolean;
  neumorphism: boolean;
  outline: boolean;
  styleFamily: string;
};

export type ReferenceImageMeta = {
  source: "pinterest" | "behance" | "dribbble" | "figma" | "seed";
  query: string;
  url?: string;
  title?: string;
};

export type AssetsIntelligenceContext = {
  category: KnowledgeCategory;
  promptBlock: string;
  agentSnippet: string;
  recommendedBadgeKey?: string;
  recommendedFontFamily?: string;
  recommendedPaletteKey?: string;
  parametricBadge?: ParametricBadgeModel;
  palette?: PaletteModel;
};

export type BadgeBuildInput = {
  model: ParametricBadgeModel;
  text: string;
  fontSizePx: number;
  icon?: string;
  accentColor: string;
  maxWidthPct?: number;
};

export type AssetUsageRecord = {
  assetKey: string;
  assetType: "badge" | "font" | "palette" | "shape";
  category: KnowledgeCategory;
  at: string;
};

export const PRODUCT_CATEGORY_LIST: ProductCategory[] = [
  "garden_tools",
  "electronics",
  "cosmetics",
  "home_appliances",
  "fashion",
  "food",
  "sport",
  "kids",
  "auto",
  "premium",
  "generic",
];
