/** Prompt Compiler v1 — deterministic rendering instructions, never invents design */
export type RenderingProfileId =
  | "premium_product"
  | "luxury"
  | "technical"
  | "industrial"
  | "minimal"
  | "medical"
  | "construction"
  | "electronics"
  | "fashion"
  | "tools"
  | "home"
  | "kitchen";

export type TypographySpec = {
  headlineZone: { left: number; top: number; width: number; height: number };
  safeForText: boolean;
  maxLines: number;
  hierarchyLevel: "H1";
};

export type BrandRules = {
  maxColors: number;
  palette: string[];
  watermark?: string;
};

export type LuxuryRules = {
  whitespaceMin: number;
  whitespaceMax: number;
  maxDecorative: number;
  maxSecondary: number;
  noFloatingProduct: boolean;
  noParticles: boolean;
};

export type RenderingStrategy = {
  profile: RenderingProfileId;
  quality: "8k" | "4k";
  photorealistic: boolean;
  marketplaceOptimized: boolean;
};

export type PromptSectionId =
  | "product_identity"
  | "scene"
  | "environment"
  | "composition"
  | "lighting"
  | "materials"
  | "camera"
  | "background"
  | "visual_hierarchy"
  | "typography_safe_zone"
  | "rendering_quality"
  | "marketplace_constraints";

export type CompiledSection = {
  id: PromptSectionId;
  module: string;
  content: string;
  reason: string;
  rulesApplied: string[];
};

export type PromptCompilerInput = {
  prompt: string;
  analysis: import("@/lib/product-analysis").ProductAnalysis;
  scenePlan: import("@/lib/design/scene-planner").ScenePlan;
  layoutSpec?: import("@/lib/design/layout-spec/types").LayoutSpec;
  sceneBlueprint?: import("@/lib/design/scene-blueprint").SceneBlueprint;
  designBrief?: import("@/lib/design-brief/schema").DesignBrief;
  storyHeroConcept?: string;
  productColors?: string[];
  productShape?: string;
  marketSnippet?: string;
  knowledgeSnippet?: string;
  genomeSnippet?: string;
  luxuryScore?: number;
  compositionScore?: number;
  sceneScore?: number;
};

export type PromptValidationResult = {
  passed: boolean;
  issues: string[];
  missingSections: PromptSectionId[];
};

export type PromptCompilerMetadata = {
  version: "1.0";
  profile: RenderingProfileId;
  sections: CompiledSection[];
  constitutionRules: string[];
  luxuryScore: number;
  compositionScore: number;
  sceneScore: number;
  readabilityScore: number;
  promptComplexityScore: number;
  validation: PromptValidationResult;
  attempts: number;
};

export type PromptCompilerResult = {
  prompt: string;
  negativePrompt: string;
  metadata: PromptCompilerMetadata;
  approved: boolean;
};

export const PROMPT_COMPILER_VERSION = "1.0";
export const DESIGN_CONSTITUTION = [
  "max 4 colors",
  "1 hero object",
  "max 3 secondary elements",
  "minimal decorative objects",
  "whitespace 20-35%",
  "no visual clutter",
  "no floating products",
  "no random particles",
  "no unnecessary gradients",
] as const;
