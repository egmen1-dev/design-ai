import type { VisualBlueprint } from "../../contracts/specs";
import {
  asRecord,
  asString,
  asStringArray,
  baseSpecificationFields,
  createDecisionTraceItem,
} from "./spec-adapter-utils";

const SOURCE = "visual-blueprint-adapter";

export function adaptVisualBlueprint(input: unknown, projectId: string): VisualBlueprint {
  const root = asRecord(input);
  const visual = asRecord(root.visualBlueprint ?? root.visual);
  const scene = asRecord(visual.scene ?? root.scene);
  const composition = asRecord(visual.composition ?? root.composition);
  const lighting = asRecord(visual.lighting ?? root.lighting);
  const camera = asRecord(visual.camera ?? root.camera);
  const scenePlan = asRecord(root.scenePlan);
  const compositionResult = asRecord(root.compositionResult);
  const layout = asRecord(compositionResult.layout);

  const sceneText =
    asString(scene.environmentArchitecture) ??
    asString(scene.sceneType) ??
    asString(scenePlan.sceneType) ??
    asString(root.sceneType) ??
    "Scene pending";

  const compositionText =
    asString(composition.templateId) ??
    asString(layout.scenarioId) ??
    asString(composition.heroPosition) ??
    "Composition pending";

  const lightingText =
    asString(lighting.preset) ??
    asString(lighting.quality) ??
    asString(scene.lightingMood) ??
    "Lighting pending";

  const cameraText = asString(camera.angle) ?? asString(camera.framing);
  const productPlacement =
    asString(composition.productPlacement) ??
    (layout.metrics ? `productAreaPct:${asRecord(layout.metrics).productAreaPct}` : undefined);

  const safeZones = asStringArray(root.safeZones).length
    ? asStringArray(root.safeZones)
    : layout.metrics
      ? [`whitespace:${asRecord(layout.metrics).whitespacePct ?? "unknown"}`]
      : undefined;

  let completeness = 0.2;
  if (sceneText !== "Scene pending") completeness += 0.3;
  if (compositionText !== "Composition pending") completeness += 0.3;
  if (lightingText !== "Lighting pending") completeness += 0.2;

  const trace = [
    createDecisionTraceItem(
      SOURCE,
      "Adapted VisualBlueprint from legacy visual pipeline",
      `scene=${sceneText}; composition=${compositionText}`,
      completeness,
    ),
  ];

  return {
    ...baseSpecificationFields(
      projectId,
      SOURCE,
      compositionText !== "Composition pending" ? "validated" : "draft",
      completeness,
      trace,
    ),
    scene: sceneText,
    composition: compositionText,
    lighting: lightingText,
    camera: cameraText,
    productPlacement,
    safeZones,
  };
}
