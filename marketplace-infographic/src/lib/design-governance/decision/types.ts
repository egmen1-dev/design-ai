/** Structured decision from any design agent — no plain-text-only outputs */

export type DesignDecisionDomain =
  | "scene"
  | "environment"
  | "lighting"
  | "style"
  | "composition"
  | "palette"
  | "camera"
  | "layout"
  | "narrative";

export type DesignDecisionSource =
  | "story-director"
  | "scene-director"
  | "composition-director"
  | "scene-planner"
  | "knowledge-engine"
  | "governance-resolver";

export type DesignDecision = {
  domain: DesignDecisionDomain;
  value: string;
  confidence: number;
  environment?: string;
  lighting?: string;
  style?: string;
  reasoning: string;
  source: DesignDecisionSource;
  agentId: string;
  metadata?: Record<string, string | number | boolean>;
};

export type AgentDecisionBundle = {
  story?: DesignDecision[];
  scene?: DesignDecision[];
  composition?: DesignDecision[];
  planner?: DesignDecision[];
  knowledge?: DesignDecision[];
};
