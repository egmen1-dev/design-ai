import type { VisualStoryDirectorResult } from "@/lib/agents/visual-story-director/types";
import type { SceneDirectorResult } from "@/lib/design/scene-blueprint";
import type { CompositionDirectorResult } from "@/lib/design/composition-director";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { DesignDecision } from "./types";

function decision(
  partial: Omit<DesignDecision, "confidence"> & { confidence?: number },
): DesignDecision {
  return {
    confidence: partial.confidence ?? 0.7,
    ...partial,
  };
}

function inferSceneFromText(text: string): string {
  const t = text.toLowerCase();
  if (/outdoor|загород|участок|дач|сад|garden|backyard|лужайк/i.test(t)) return "outdoor";
  if (/kitchen|кухн/i.test(t)) return "kitchen";
  if (/studio|студи|cyclorama|циклорам/i.test(t)) return "studio";
  if (/interior|интерьер|дом|home|living/i.test(t)) return "interior";
  if (/industrial|индустр|workshop|мастерск|construction|строй/i.test(t)) return "industrial";
  if (/nature|природ/i.test(t)) return "nature";
  return "commercial";
}

function inferLightingFromText(text: string): string {
  const t = text.toLowerCase();
  if (/golden|закат|sunset|warm/i.test(t)) return "golden_hour";
  if (/studio|softbox|студи/i.test(t)) return "studio";
  if (/industrial|cold|холодн/i.test(t)) return "industrial";
  return "commercial";
}

export function extractStoryDecisions(
  story?: VisualStoryDirectorResult,
): DesignDecision[] {
  if (!story) return [];
  const narrative = `${story.heroConcept} ${story.sceneNarrative} ${story.customerIntent}`;
  const scene = inferSceneFromText(narrative);
  const lighting = inferLightingFromText(narrative);
  const conf = Math.min(0.99, (story.score ?? 70) / 100);
  return [
    decision({
      domain: "scene",
      value: scene,
      confidence: conf,
      environment: scene === "outdoor" ? "garden" : scene,
      lighting,
      style: story.approved ? "premium" : "commercial",
      reasoning: story.heroConcept || story.sceneNarrative,
      source: "story-director",
      agentId: "visual-story-director",
    }),
    decision({
      domain: "narrative",
      value: story.heroConcept,
      confidence: conf,
      reasoning: story.customerIntent,
      source: "story-director",
      agentId: "visual-story-director",
    }),
    decision({
      domain: "composition",
      value: story.compositionScenarioId ?? "hero_right",
      confidence: conf * 0.9,
      reasoning: "Story composition scenario",
      source: "story-director",
      agentId: "visual-story-director",
    }),
  ];
}

export function extractSceneDecisions(scene?: SceneDirectorResult): DesignDecision[] {
  if (!scene) return [];
  const bp = scene.blueprint;
  const conf = Math.min(0.99, scene.quality.total / 100);
  return [
    decision({
      domain: "scene",
      value: scene.sceneType,
      confidence: conf,
      environment: bp.scene.environment,
      lighting: bp.lighting.preset,
      style: bp.premiumFeeling >= 70 ? "premium" : "commercial",
      reasoning: bp.scene.atmosphere,
      source: "scene-director",
      agentId: "scene-director",
      metadata: { sceneType: scene.sceneType },
    }),
    decision({
      domain: "lighting",
      value: bp.lighting.preset,
      confidence: conf * 0.95,
      lighting: bp.lighting.preset,
      reasoning: `${bp.lighting.key}, ${bp.lighting.temperatureK}K`,
      source: "scene-director",
      agentId: "scene-director",
    }),
    decision({
      domain: "environment",
      value: bp.scene.environment,
      confidence: conf * 0.9,
      environment: bp.scene.environment,
      reasoning: bp.scene.background,
      source: "scene-director",
      agentId: "scene-director",
    }),
  ];
}

export function extractCompositionDecisions(
  comp?: CompositionDirectorResult,
): DesignDecision[] {
  if (!comp) return [];
  const conf = Math.min(0.99, comp.quality.total / 100);
  const spec = comp.layoutSpec;
  return [
    decision({
      domain: "composition",
      value: comp.templateId,
      confidence: conf,
      reasoning: `Layout template ${comp.templateId}`,
      source: "composition-director",
      agentId: "composition-director",
    }),
    decision({
      domain: "layout",
      value: spec.heroPosition,
      confidence: conf * 0.92,
      reasoning: `Hero ${spec.heroPosition}, whitespace ${spec.whitespaceTarget}%`,
      source: "composition-director",
      agentId: "composition-director",
    }),
    decision({
      domain: "palette",
      value: spec.palette.slice(0, 4).join(","),
      confidence: conf * 0.85,
      reasoning: spec.backgroundStyle,
      source: "composition-director",
      agentId: "composition-director",
    }),
  ];
}

export function extractPlannerDecisions(scenePlan: ScenePlan): DesignDecision[] {
  const narrative = `${scenePlan.visualMood} ${scenePlan.backgroundType} ${scenePlan.surfaceType}`;
  const scene = inferSceneFromText(narrative);
  const conf = 0.65;
  return [
    decision({
      domain: "scene",
      value: scene,
      confidence: conf,
      environment: scenePlan.backgroundType,
      lighting: scenePlan.lightingDirection,
      style: scenePlan.cardStyle,
      reasoning: `Planner coverConcept ${scenePlan.coverConceptId}`,
      source: "scene-planner",
      agentId: "scene-planner",
    }),
    decision({
      domain: "environment",
      value: scenePlan.backgroundType,
      confidence: conf,
      environment: scenePlan.surfaceType,
      reasoning: scenePlan.visualMood,
      source: "scene-planner",
      agentId: "scene-planner",
    }),
  ];
}

export function extractKnowledgeDecisions(
  analysis: ProductAnalysis,
): DesignDecision[] {
  const categoryScene: Record<string, { scene: string; env: string; boost: number }> = {
    home_appliances: { scene: "outdoor", env: "luxury_backyard", boost: 0.2 },
    garden_tools: { scene: "outdoor", env: "garden", boost: 0.25 },
    electronics: { scene: "studio", env: "tech_studio", boost: 0.15 },
    cosmetics: { scene: "studio", env: "beauty_studio", boost: 0.2 },
    auto: { scene: "industrial", env: "garage", boost: 0.15 },
    sport: { scene: "lifestyle", env: "active_outdoor", boost: 0.15 },
  };
  const rule = categoryScene[analysis.category] ?? {
    scene: "commercial",
    env: "studio",
    boost: 0.1,
  };
  return [
    decision({
      domain: "scene",
      value: rule.scene,
      confidence: 0.75 + rule.boost,
      environment: rule.env,
      style: analysis.priceSegment === "premium" ? "premium" : "commercial",
      reasoning: `Category ${analysis.category} constraint`,
      source: "knowledge-engine",
      agentId: "knowledge-engine",
    }),
  ];
}
