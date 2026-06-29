import type { DesignDecision } from "../decision/types";
import type { DesignConflict } from "../conflicts/types";
import type { FinalDesignBlueprint } from "../blueprint/types";
import type { GovernanceScorecard } from "../scores/evaluate";
import type { ConstitutionReport } from "@/lib/design/design-constitution";
import type { StoredRenderReport } from "@/lib/generation/diagnostic-report";

export type DecisionTraceNode = {
  agentId: string;
  domain: string;
  value: string;
  confidence: number;
  chosen: boolean;
  reason?: string;
  children?: DecisionTraceNode[];
};

export type DecisionTrace = {
  version: "17.1";
  createdAt: string;
  nodes: DecisionTraceNode[];
  resolverOutcome: {
    scene: string;
    environment: string;
    lighting: string;
    composition: string;
    reasoning: string;
  };
  discarded: FinalDesignBlueprint["discarded"];
  conflicts: DesignConflict[];
};

export function buildDecisionTrace(blueprint: FinalDesignBlueprint): DecisionTrace {
  const nodes: DecisionTraceNode[] = blueprint.resolvedDecisions.map((d) => ({
    agentId: d.agentId,
    domain: d.domain,
    value: d.value,
    confidence: d.confidence,
    chosen:
      d.agentId === "governance-resolver" ||
      (d.domain === "scene" && d.value === blueprint.scene && d.source !== "scene-planner"),
    reason: d.reasoning,
  }));

  return {
    version: "17.1",
    createdAt: new Date().toISOString(),
    nodes,
    resolverOutcome: {
      scene: blueprint.scene,
      environment: blueprint.environment,
      lighting: blueprint.lighting,
      composition: blueprint.composition,
      reasoning: blueprint.reasoning,
    },
    discarded: blueprint.discarded,
    conflicts: blueprint.conflicts,
  };
}

export type RenderReportJson = {
  version: "17.1";
  createdAt: string;
  chosenScene: string;
  discardedScenes: Array<{ source: string; value: string; reason: string }>;
  conflicts: DesignConflict[];
  chosenLighting: string;
  chosenEnvironment: string;
  chosenComposition: string;
  provider?: string;
  model?: string;
  retries?: number;
  constitutionStatus: "passed" | "failed";
  constitutionReports?: ConstitutionReport[];
  professionalScore: number;
  scorecard: GovernanceScorecard;
  decisionLog: string[];
  renderReport?: StoredRenderReport;
};

export function buildRenderReportJson(input: {
  blueprint: FinalDesignBlueprint;
  constitutionReports: ConstitutionReport[];
  constitutionPassed: boolean;
  scorecard: GovernanceScorecard;
  renderReport?: StoredRenderReport;
  decisionLog: string[];
}): RenderReportJson {
  return {
    version: "17.1",
    createdAt: new Date().toISOString(),
    chosenScene: input.blueprint.scene,
    discardedScenes: input.blueprint.discarded.filter((d) =>
      /kitchen|outdoor|studio|interior|industrial/i.test(d.value),
    ),
    conflicts: input.blueprint.conflicts,
    chosenLighting: input.blueprint.lighting,
    chosenEnvironment: input.blueprint.environment,
    chosenComposition: input.blueprint.composition,
    provider: input.renderReport?.attempts[0]?.providerId,
    model: input.renderReport?.selectedModel,
    retries: input.renderReport?.attempts.length,
    constitutionStatus: input.constitutionPassed ? "passed" : "failed",
    constitutionReports: input.constitutionReports,
    professionalScore: input.scorecard.professional,
    scorecard: input.scorecard,
    decisionLog: input.decisionLog,
    renderReport: input.renderReport,
  };
}
