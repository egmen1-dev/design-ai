import type { DAOSDecisionTraceItem } from "../contracts/base";
import type { DAOSProjectState } from "../core/project-state";
import { updateProjectState } from "../core/project-state";
import type {
  CommercialSpec,
  CreativeSpec,
  KnowledgeSpec,
  RenderBlueprint,
  VisualBlueprint,
} from "../contracts/specs";
import {
  adaptCommercialSpec,
  adaptCreativeSpec,
  adaptKnowledgeSpec,
  adaptRenderBlueprint,
  adaptVisualBlueprint,
} from "./spec-adapters";

export type DaosPipelineSnapshot = {
  knowledge?: unknown;
  commercial?: unknown;
  creative?: unknown;
  visual?: unknown;
  render?: unknown;
};

function mergeDecisionTrace(
  state: DAOSProjectState,
  specs: Array<{ decisionTrace: DAOSDecisionTraceItem[] } | undefined>,
): DAOSProjectState["decisionTrace"] {
  const seen = new Set(state.decisionTrace.map((t) => t.id));
  const merged: DAOSDecisionTraceItem[] = [...state.decisionTrace];
  for (const spec of specs) {
    if (!spec) continue;
    for (const item of spec.decisionTrace) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
  }
  return merged;
}

/** Wave 2 — enrich ProjectState from legacy pipeline outputs (diagnostics only). */
export function enrichDaosStateFromPipeline(
  state: DAOSProjectState,
  snapshot: DaosPipelineSnapshot,
): DAOSProjectState {
  const projectId = state.projectId;
  let knowledgeSpec: KnowledgeSpec | undefined;
  let commercialSpec: CommercialSpec | undefined;
  let creativeSpec: CreativeSpec | undefined;
  let visualBlueprint: VisualBlueprint | undefined;
  let renderBlueprint: RenderBlueprint | undefined;
  let status: DAOSProjectState["status"] | undefined;

  if (snapshot.knowledge !== undefined) {
    knowledgeSpec = adaptKnowledgeSpec(snapshot.knowledge, projectId);
    status = "knowledge_ready";
  }

  if (snapshot.commercial !== undefined) {
    commercialSpec = adaptCommercialSpec(snapshot.commercial, projectId);
    status = "commercial_ready";
  }

  if (snapshot.creative !== undefined) {
    creativeSpec = adaptCreativeSpec(snapshot.creative, projectId);
    status = "creative_ready";
  }

  if (snapshot.visual !== undefined) {
    visualBlueprint = adaptVisualBlueprint(snapshot.visual, projectId);
    status = "visual_ready";
  }

  if (snapshot.render !== undefined) {
    renderBlueprint = adaptRenderBlueprint(snapshot.render, projectId);
    status = "render_ready";
  }

  if (!status) {
    return state;
  }

  return updateProjectState(state, {
    knowledgeSpec,
    commercialSpec,
    creativeSpec,
    visualBlueprint,
    renderBlueprint,
    status,
    decisionTrace: mergeDecisionTrace(state, [
      knowledgeSpec,
      commercialSpec,
      creativeSpec,
      visualBlueprint,
      renderBlueprint,
    ]),
  });
}
