/**
 * Chapter 3.2 — Agent contract types
 */
import type { BlueprintSection, RenderBlueprint } from "./types";
import type { BlueprintLifecycle } from "./lifecycle-types";

export type AgentContractId =
  | "product-analyzer"
  | "creative-engine"
  | "visual-story-director"
  | "scene-director"
  | "commercial-photo-director"
  | "camera-director"
  | "lighting-director"
  | "material-director"
  | "typography-director"
  | "marketplace-director"
  | "composition-director"
  | "governance"
  | "critics"
  | "chief-design-director"
  | "design-memory"
  | "flux-adapter"
  | "vision-quality-director";

export type AgentErrorKind = "recoverable" | "fatal";

export type AgentError = {
  kind: AgentErrorKind;
  code: string;
  message: string;
};

export type RetryAdvice = {
  required: boolean;
  reason: string;
  recommendedStage: BlueprintLifecycle;
  snapshotId?: string;
};

/** Base result — every agent must return confidence + decisionTrace */
export type AgentResultBase = {
  confidence: number;
  decisionTrace: string[];
  warnings: string[];
  errors?: AgentError[];
  retryAdvice?: RetryAdvice;
};

export type BlueprintMutationResult = {
  blueprint: RenderBlueprint;
  updatedSections: BlueprintSection[];
  invalidatedSections: BlueprintSection[];
  warnings: string[];
  errors: AgentError[];
  decisionTrace: string[];
  nextStage?: BlueprintLifecycle;
};

export type BlueprintAgent<TInput, TResult extends AgentResultBase> = {
  readonly id: AgentContractId;
  readonly version: string;
  readonly stage: BlueprintLifecycle;
  canExecute(blueprint: RenderBlueprint): boolean;
  execute(blueprint: Readonly<RenderBlueprint>, input: TInput): Promise<TResult>;
  /** Pure mapping: result → section updates. Does NOT mutate blueprint. */
  toUpdates(result: TResult): AgentSectionUpdates;
};

export type AgentSectionUpdates = Partial<{
  meta: never;
  creative: import("./types").CreativeBlueprint;
  story: import("./types").StoryBlueprint;
  product: import("./types").ProductBlueprint;
  scene: import("./types").SceneBlueprint;
  photography: import("./types").PhotographyBlueprint;
  camera: import("./types").CameraBlueprint;
  lighting: import("./types").LightingBlueprint;
  materials: import("./types").MaterialBlueprint;
  composition: import("./types").CompositionBlueprint;
  background: import("./types").BackgroundBlueprint;
  constraints: import("./types").ConstraintBlueprint;
  validation: import("./types").ValidationBlueprint;
  render: never;
}>;

export class AgentContractError extends Error {
  readonly kind: AgentErrorKind;

  constructor(kind: AgentErrorKind, message: string, readonly code: string) {
    super(message);
    this.name = "AgentContractError";
    this.kind = kind;
    this.code = code;
  }
}

export function assertAgentConfidence(confidence: number, agentId: string): void {
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
    throw new AgentContractError(
      "fatal",
      `Agent ${agentId} confidence must be 0..100, got ${confidence}`,
      "INVALID_CONFIDENCE",
    );
  }
}
