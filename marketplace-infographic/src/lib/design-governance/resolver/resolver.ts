import type { SceneBlueprint, SceneTypeId } from "@/lib/design/scene-blueprint";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { VisualStoryDirectorResult } from "@/lib/agents/visual-story-director/types";
import type { SceneDirectorResult } from "@/lib/design/scene-blueprint";
import type { CompositionDirectorResult } from "@/lib/design/composition-director";
import type { FinalDesignBlueprint } from "../blueprint/types";
import type { AgentDecisionBundle, DesignDecision } from "../decision/types";
import {
  extractCompositionDecisions,
  extractKnowledgeDecisions,
  extractPlannerDecisions,
  extractSceneDecisions,
  extractStoryDecisions,
} from "../decision/extractors";
import { detectConflicts, scoreDecision } from "../conflicts/detect";
import { buildBlueprintFromTemplate } from "@/lib/design/scene-blueprint/templates";
import { resolveLighting } from "@/lib/design/scene-blueprint/lighting";
import { buildInitialLayoutSpec } from "@/lib/design/layout-spec";
import { applyBlueprintToScenePlan } from "@/lib/design/scene-blueprint/to-scene-plan";

export type ResolverInput = {
  analysis: ProductAnalysis;
  storyDirection?: VisualStoryDirectorResult;
  sceneDirection?: SceneDirectorResult;
  compositionDirection?: CompositionDirectorResult;
  scenePlan: ScenePlan;
  sceneBlueprint?: SceneBlueprint;
  layoutSpec?: LayoutSpec;
};

const RESOLVED_SCENE_TO_TYPE: Record<string, SceneTypeId> = {
  outdoor: "nature",
  kitchen: "kitchen",
  studio: "premium_studio",
  interior: "lifestyle",
  industrial: "industrial_studio",
  commercial: "premium_studio",
  nature: "nature",
  lifestyle: "lifestyle",
};

function categoryBoost(analysis: ProductAnalysis): Record<string, number> {
  const boosts: Record<string, number> = {};
  if (analysis.category === "home_appliances") {
    boosts.outdoor = 20;
    boosts.nature = 18;
    boosts.lifestyle = 8;
    boosts.kitchen = -15;
    boosts.interior = -10;
    boosts.studio = 5;
  }
  if (analysis.category === "garden_tools") {
    boosts.outdoor = 25;
    boosts.nature = 22;
    boosts.kitchen = -20;
  }
  if (analysis.category === "electronics") {
    boosts.studio = 15;
    boosts.technology = 12;
    boosts.outdoor = -10;
  }
  if (analysis.category === "cosmetics") {
    boosts.studio = 18;
    boosts.premium_studio = 15;
  }
  return boosts;
}

function pickWinner(
  decisions: DesignDecision[],
  boosts: Record<string, number>,
): DesignDecision {
  const sorted = [...decisions].sort(
    (a, b) => scoreDecision(b, boosts) - scoreDecision(a, boosts),
  );
  return sorted[0];
}

function mapResolvedSceneToType(scene: string): SceneTypeId {
  const key = scene.toLowerCase();
  return RESOLVED_SCENE_TO_TYPE[key] ?? (key as SceneTypeId) ?? "premium_studio";
}

function mapResolvedLighting(lighting: string): import("@/lib/design/scene-blueprint/types").LightingPresetId {
  const l = lighting.toLowerCase();
  if (/golden|sunset/.test(l)) return "sunset_rim";
  if (/industrial|cold/.test(l)) return "cold_industrial";
  if (/warm/.test(l)) return "warm_spotlight";
  if (/luxury/.test(l)) return "luxury_softbox";
  return "soft_studio";
}

export function collectAgentDecisions(input: ResolverInput): AgentDecisionBundle {
  return {
    story: extractStoryDecisions(input.storyDirection),
    scene: extractSceneDecisions(input.sceneDirection),
    composition: extractCompositionDecisions(input.compositionDirection),
    planner: extractPlannerDecisions(input.scenePlan),
    knowledge: extractKnowledgeDecisions(input.analysis),
  };
}

/**
 * Design Decision Resolver — produces ONE synchronized FinalDesignBlueprint.
 */
export function resolveDesignDecisions(input: ResolverInput): FinalDesignBlueprint {
  const bundle = collectAgentDecisions(input);
  const allDecisions: DesignDecision[] = [
    ...(bundle.knowledge ?? []),
    ...(bundle.story ?? []),
    ...(bundle.scene ?? []),
    ...(bundle.composition ?? []),
    ...(bundle.planner ?? []),
  ];

  const boosts = categoryBoost(input.analysis);
  const conflicts = detectConflicts(allDecisions);

  const sceneCandidates = allDecisions.filter((d) => d.domain === "scene");
  const winningScene = pickWinner(sceneCandidates, boosts);
  const resolvedScene = winningScene.value;

  const lightingCandidates = allDecisions.filter(
    (d) => d.domain === "lighting" || d.lighting,
  );
  const winningLighting =
    lightingCandidates.length > 0
      ? pickWinner(
          lightingCandidates.map((d) =>
            d.domain === "lighting"
              ? d
              : { ...d, domain: "lighting" as const, value: d.lighting! },
          ),
          boosts,
        )
      : winningScene;

  const compCandidates = allDecisions.filter((d) => d.domain === "composition");
  const winningComp =
    compCandidates.length > 0
      ? pickWinner(compCandidates, boosts)
      : ({
          domain: "composition" as const,
          value: input.compositionDirection?.templateId ?? "hero_right",
          confidence: 0.7,
          reasoning: "default composition",
          source: "governance-resolver" as const,
          agentId: "governance-resolver",
        } satisfies DesignDecision);

  const layoutCandidates = allDecisions.filter((d) => d.domain === "layout");
  const winningLayout =
    layoutCandidates.length > 0
      ? pickWinner(layoutCandidates, boosts)
      : ({
          domain: "layout" as const,
          value: input.layoutSpec?.heroPosition ?? "right",
          confidence: 0.7,
          reasoning: "default layout",
          source: "governance-resolver" as const,
          agentId: "governance-resolver",
        } satisfies DesignDecision);

  const discarded: FinalDesignBlueprint["discarded"] = [];
  for (const d of allDecisions) {
    if (d.agentId === winningScene.agentId && d.domain === "scene") continue;
    if (d.domain === "scene" && d.value !== resolvedScene) {
      discarded.push({
        source: d.agentId,
        value: d.value,
        reason: `Lost to ${winningScene.agentId} (${resolvedScene}) via confidence+category`,
      });
    }
    if (d.domain === "scene" && d.agentId !== winningScene.agentId && d.value === resolvedScene) {
      discarded.push({
        source: d.agentId,
        value: d.value,
        reason: `Same scene but lower score than ${winningScene.agentId}`,
      });
    }
  }

  for (const c of conflicts) {
    c.resolvedValue = resolvedScene;
    c.resolutionReason = `Resolver chose ${winningScene.agentId} with category boost`;
  }

  const sceneTypeId = mapResolvedSceneToType(resolvedScene);
  const lightingPreset = mapResolvedLighting(
    winningLighting.lighting ?? winningLighting.value,
  );

  const baseBlueprint =
    input.sceneBlueprint ??
    input.sceneDirection?.blueprint ??
    buildBlueprintFromTemplate(sceneTypeId);

  const syncedBlueprint = buildBlueprintFromTemplate(sceneTypeId, {
    ...baseBlueprint,
    scene: {
      ...baseBlueprint.scene,
      type: sceneTypeId,
      environment:
        winningScene.environment ??
        baseBlueprint.scene.environment,
      atmosphere: winningScene.reasoning.slice(0, 120) || baseBlueprint.scene.atmosphere,
    },
    lighting: resolveLighting(lightingPreset),
    hero: baseBlueprint.hero,
    camera: baseBlueprint.camera,
  });

  const syncedLayoutSpec: LayoutSpec = {
    ...(input.layoutSpec ??
      input.compositionDirection?.layoutSpec ??
      buildInitialLayoutSpec({
        analysis: input.analysis,
        palette: ["#1a1a2e", "#f97316", "#ffffff", "#0f172a"],
      })),
    compositionTemplateId: winningComp.value as LayoutSpec["compositionTemplateId"],
    heroPosition: (winningLayout.value.includes("left")
      ? "left"
      : winningLayout.value.includes("center")
        ? "center"
        : "right") as LayoutSpec["heroPosition"],
    backgroundStyle:
      sceneTypeId === "nature" || sceneTypeId === "lifestyle"
        ? "minimal_interior"
        : sceneTypeId === "modern_dark" || sceneTypeId === "industrial_studio"
          ? "dark_premium"
          : "soft_gradient",
    lightingStyle:
      lightingPreset === "sunset_rim" || lightingPreset === "warm_spotlight"
        ? "natural_warm"
        : lightingPreset === "cold_industrial"
          ? "rim_dark"
          : "soft_key_top_left",
  };

  const syncedScenePlan = applyBlueprintToScenePlan(input.scenePlan, syncedBlueprint);

  const resolverDecision: DesignDecision = {
    domain: "scene",
    value: resolvedScene,
    confidence: winningScene.confidence,
    environment: syncedBlueprint.scene.environment,
    lighting: lightingPreset,
    style: winningScene.style ?? "commercial",
    reasoning: `Resolver sync: ${winningScene.agentId} won scene; ${discarded.length} discarded`,
    source: "governance-resolver",
    agentId: "governance-resolver",
  };

  return {
    version: "17.1",
    scene: resolvedScene,
    environment: syncedBlueprint.scene.environment,
    lighting: lightingPreset,
    style: winningScene.style ?? "commercial",
    composition: winningComp.value,
    layout: winningLayout.value,
    palette: syncedLayoutSpec.palette,
    camera: `${syncedBlueprint.camera.lensMm}mm ${syncedBlueprint.camera.angle}`,
    narrative: input.storyDirection?.heroConcept ?? winningScene.reasoning,
    confidence: winningScene.confidence,
    reasoning: resolverDecision.reasoning,
    discarded,
    conflicts,
    resolvedDecisions: [...allDecisions, resolverDecision],
    sceneBlueprint: syncedBlueprint,
    layoutSpec: syncedLayoutSpec,
    scenePlan: syncedScenePlan,
    locked: true,
  };
}
