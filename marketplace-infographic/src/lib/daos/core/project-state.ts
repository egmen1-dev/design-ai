import type {
  ProductBrief,
  ResearchSpec,
  KnowledgeSpec,
  CommercialSpec,
  CreativeSpec,
  VisualBlueprint,
  RenderBlueprint,
  VisionReport,
  LearningReport,
} from "../contracts/specs";
import type { DAOSDecisionTraceItem } from "../contracts/base";

export type DAOSProjectStatus =
  | "created"
  | "brief_ready"
  | "research_ready"
  | "knowledge_ready"
  | "commercial_ready"
  | "creative_ready"
  | "visual_ready"
  | "render_ready"
  | "vision_ready"
  | "completed"
  | "failed";

export type DAOSProjectState = Readonly<{
  projectId: string;
  runId: string;
  status: DAOSProjectStatus;
  createdAt: string;
  updatedAt: string;
  architectureVersion: "daos-v1";
  brief?: ProductBrief;
  researchSpec?: ResearchSpec;
  knowledgeSpec?: KnowledgeSpec;
  commercialSpec?: CommercialSpec;
  creativeSpec?: CreativeSpec;
  visualBlueprint?: VisualBlueprint;
  renderBlueprint?: RenderBlueprint;
  visionReport?: VisionReport;
  learningReport?: LearningReport;
  decisionTrace: DAOSDecisionTraceItem[];
  events: DAOSProjectEvent[];
  debug: DAOSDebugArtifact[];
}>;

export type DAOSProjectEvent = {
  id: string;
  type: string;
  source: string;
  createdAt: string;
  payload?: unknown;
};

export type DAOSDebugArtifact = {
  id: string;
  name: string;
  type: "json" | "text" | "image" | "log";
  path?: string;
  data?: unknown;
  createdAt: string;
};

export function createProjectState(input: {
  projectId: string;
  runId: string;
}): DAOSProjectState {
  const now = new Date().toISOString();

  return Object.freeze({
    projectId: input.projectId,
    runId: input.runId,
    status: "created",
    createdAt: now,
    updatedAt: now,
    architectureVersion: "daos-v1",
    decisionTrace: [],
    events: [],
    debug: [],
  });
}

export function updateProjectState(
  state: DAOSProjectState,
  patch: Partial<Omit<DAOSProjectState, "projectId" | "runId" | "createdAt" | "architectureVersion">>,
): DAOSProjectState {
  return Object.freeze({
    ...state,
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}
