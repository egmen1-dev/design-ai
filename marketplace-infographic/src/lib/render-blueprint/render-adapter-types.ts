/**
 * Chapter 4.17 — Render Adapter types
 */

export type SemanticSectionId =
  | "story"
  | "scene"
  | "photography"
  | "lighting"
  | "camera"
  | "materials"
  | "composition";

export type SemanticBlock = {
  section: SemanticSectionId;
  label: string;
  value: string;
};

/** Chapter 4.17 — provider-facing render intent (translator output, not blueprint snapshot) */
export type AdapterRenderIntent = {
  provider: string;
  positivePrompt: string;
  negativePrompt: string;
  styleHints: string[];
  providerHints: string[];
  cameraHints: string[];
  lightingHints: string[];
  materialHints: string[];
  qualityHints: string[];
  seed: number;
  aspectRatio: string;
  confidence: number;
};

export type RenderAdapterContext = {
  providerId: string;
  quality?: string;
  aspectRatio?: string;
  seed?: number;
};

export type PromptBlockTrace = {
  section: SemanticSectionId;
  promptFragment: string;
};

export type RenderAdapterExplainabilityReport = {
  agentId: "flux-adapter";
  semanticBlocks: SemanticBlock[];
  promptBlocks: PromptBlockTrace[];
  rejectedCreativeAdditions: string[];
  blueprintFidelity: string;
  reasoning: string[];
};

export type RenderAdapterValidationReport = {
  valid: boolean;
  violations: string[];
  intent?: AdapterRenderIntent;
};

export type RenderAdapterFailureCode =
  | "MISSING_BLUEPRINT_SECTION"
  | "CREATIVE_ADDITION"
  | "BLUEPRINT_DRIFT"
  | "BANNED_TERMS"
  | "CONTAINS_COORDINATES"
  | "PROMPT_NOT_DERIVED"
  | "PROVIDER_UNSUPPORTED";
