import type { RenderBlueprint } from "../../contracts/specs";
import {
  asRecord,
  asString,
  baseSpecificationFields,
  createDecisionTraceItem,
} from "./spec-adapter-utils";

const SOURCE = "render-blueprint-adapter";

type RenderStrategy = RenderBlueprint["renderStrategy"];

function resolveRenderStrategy(input: Record<string, unknown>): RenderStrategy {
  const explicit = asString(input.renderStrategy);
  if (
    explicit === "background_only" ||
    explicit === "hybrid_shadow_scene" ||
    explicit === "integrated_scene"
  ) {
    return explicit;
  }
  const request = asRecord(input.request ?? input.renderEngineResult);
  const profile = asString(request.profileId) ?? asString(request.renderProfile);
  if (profile?.includes("lifestyle") || profile?.includes("integrated")) {
    return "integrated_scene";
  }
  if (asString(input.composeSkipped) === "true" || input.skipCompose === true) {
    return "background_only";
  }
  return "hybrid_shadow_scene";
}

export function adaptRenderBlueprint(input: unknown, projectId: string): RenderBlueprint {
  const root = asRecord(input);
  const request = asRecord(root.request ?? asRecord(root.renderEngineResult).request);
  const renderStrategy = resolveRenderStrategy(root);
  const provider =
    asString(request.providerId) ??
    asString(request.selectedProvider) ??
    asString(root.provider) ??
    asString(root.renderProvider);

  let completeness = 0.35;
  if (provider) completeness += 0.25;
  if (Object.keys(request).length > 0) completeness += 0.25;
  if (renderStrategy !== "hybrid_shadow_scene") completeness += 0.05;

  const trace = [
    createDecisionTraceItem(
      SOURCE,
      "Adapted RenderBlueprint from legacy render request",
      `strategy=${renderStrategy}; provider=${provider ?? "unknown"}`,
      completeness,
      ["promptAllowedOnlyInAdapter: enforced by DAOS contract"],
    ),
  ];

  return {
    ...baseSpecificationFields(
      projectId,
      SOURCE,
      provider ? "validated" : "draft",
      completeness,
      trace,
    ),
    renderStrategy,
    provider,
    promptAllowedOnlyInAdapter: true,
  };
}
