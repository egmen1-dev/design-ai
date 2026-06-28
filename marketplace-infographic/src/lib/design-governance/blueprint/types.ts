import type { SceneBlueprint } from "@/lib/design/scene-blueprint";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { DesignConflict } from "../conflicts/types";
import type { DesignDecision } from "../decision/types";

/** Single authoritative design state — read-only for downstream modules */
export type FinalDesignBlueprint = {
  version: "17.1";
  scene: string;
  environment: string;
  lighting: string;
  style: string;
  composition: string;
  layout: string;
  palette: string[];
  camera: string;
  narrative: string;
  confidence: number;
  reasoning: string;
  discarded: Array<{ source: string; value: string; reason: string }>;
  conflicts: DesignConflict[];
  resolvedDecisions: DesignDecision[];
  sceneBlueprint: SceneBlueprint;
  layoutSpec: LayoutSpec;
  scenePlan: ScenePlan;
  locked: true;
};
