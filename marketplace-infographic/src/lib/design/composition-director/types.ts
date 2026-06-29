/** Normalized 0–1 geometry — single source of spatial truth */
export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

export type LayoutCanvas = {
  width: number;
  height: number;
};

export type LayoutGrid = {
  columns: 12;
  margin: number;
  gutter: number;
};

export type LayoutGeometry = {
  canvas: LayoutCanvas;
  grid: LayoutGrid;
  hero: NormalizedRect;
  headline: NormalizedRect;
  benefits: NormalizedRect;
  cta: NormalizedRect;
};

/** Normalized visual weight — sums to ~1.0 */
export type NormalizedVisualWeight = {
  hero: number;
  headline: number;
  benefits: number;
  cta: number;
  background: number;
};

export type HierarchyLevel = "H1" | "hero" | "supporting" | "cta" | "decorative";

export type CompositionTemplateId =
  | "hero_left"
  | "hero_right"
  | "hero_bottom"
  | "hero_center"
  | "diagonal"
  | "premium_minimal"
  | "luxury_split"
  | "technical"
  | "comparison"
  | "feature_focus"
  | "lifestyle"
  | "gallery";

export type CompositionConstraints = {
  id: CompositionTemplateId;
  label: string;
  heroSide: "left" | "right" | "bottom" | "center-offset";
  heroWidth: [number, number];
  heroHeight: [number, number];
  headlineWidth: [number, number];
  headlineHeight: [number, number];
  whitespaceTarget: [number, number];
  maxSecondaryObjects: number;
  maxDecorativeObjects: number;
  allowSymmetry: boolean;
  layoutEngineTemplate?: import("@/lib/layout-engine/types").LayoutTemplateId;
};

export type EyeFlowScore = {
  score: number;
  passed: boolean;
  order: ("hero" | "headline" | "benefits" | "cta")[];
  validOrder: boolean;
  penalties: string[];
  corrections: LayoutGeometryPatch[];
};

export type VisualBalanceScore = {
  score: number;
  passed: boolean;
  leftRightDelta: number;
  topBottomDelta: number;
  centerOfGravity: { x: number; y: number };
  negativeSpaceRatio: number;
  corrections: LayoutGeometryPatch[];
};

export type WhitespaceScore = {
  score: number;
  passed: boolean;
  occupiedArea: number;
  negativeArea: number;
  density: number;
  edgePressure: number;
  crowded: boolean;
  corrections: LayoutGeometryPatch[];
};

export type CompositionQuality = {
  eyeFlow: EyeFlowScore;
  balance: VisualBalanceScore;
  whitespace: WhitespaceScore;
  hierarchyScore: number;
  total: number;
  passed: boolean;
  issues: string[];
};

export type LayoutGeometryPatch = {
  hero?: Partial<import("./types").NormalizedRect>;
  headline?: Partial<import("./types").NormalizedRect>;
  benefits?: Partial<import("./types").NormalizedRect>;
  cta?: Partial<import("./types").NormalizedRect>;
  whitespaceRatio?: number;
  visualWeight?: Partial<NormalizedVisualWeight>;
};

export type CompositionDirectorInput = {
  prompt: string;
  analysis: import("@/lib/product-analysis").ProductAnalysis;
  storyDirection?: import("@/lib/agents/visual-story-director/types").VisualStoryDirectorResult;
  sceneBlueprint?: import("@/lib/design/scene-blueprint").SceneBlueprint;
  genomeTemplateId?: import("@/lib/layout-engine/types").LayoutTemplateId;
  palette?: string[];
  seed?: string;
  knowledgeCategory?: string;
};

export type CompositionDirectorResult = {
  layoutSpec: import("@/lib/design/layout-spec/types").LayoutSpec;
  templateId: CompositionTemplateId;
  quality: CompositionQuality;
  approved: boolean;
  attempts: number;
  agentSnippet: string;
  source: "template" | "corrected";
};

export const COMPOSITION_PASS_THRESHOLD = 78;
export const WB_CANVAS = { width: 900, height: 1200 } as const;
