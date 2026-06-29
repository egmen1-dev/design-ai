import type { ProductAnalysis } from "@/lib/product-analysis";
import type { ScenePlan } from "./scene-planner";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { SceneBlueprint } from "@/lib/design/scene-blueprint";
import type { DesignBrief } from "@/lib/design-brief/schema";
import {
  compileRenderingPrompt,
  type PromptCompilerResult,
} from "@/lib/design/prompt-compiler";

export type ScenePromptContext = {
  prompt?: string;
  dominantColors?: string[];
  shape?: string;
  layoutSpec?: LayoutSpec;
  sceneBlueprint?: SceneBlueprint;
  designBrief?: DesignBrief;
  storyHeroConcept?: string;
  marketSnippet?: string;
  knowledgeSnippet?: string;
  genomeSnippet?: string;
  luxuryScore?: number;
  compositionScore?: number;
  sceneScore?: number;
};

/** Deterministic Prompt Compiler — compiles structured design into SD instructions */
export function compileSceneRenderingPrompt(
  scene: ScenePlan,
  analysis: ProductAnalysis,
  context?: ScenePromptContext,
): PromptCompilerResult {
  return compileRenderingPrompt({
    prompt: context?.prompt ?? "",
    analysis,
    scenePlan: scene,
    layoutSpec: context?.layoutSpec,
    sceneBlueprint: context?.sceneBlueprint,
    designBrief: context?.designBrief,
    storyHeroConcept: context?.storyHeroConcept,
    productColors: context?.dominantColors,
    productShape: context?.shape,
    marketSnippet: context?.marketSnippet,
    knowledgeSnippet: context?.knowledgeSnippet,
    genomeSnippet: context?.genomeSnippet,
    luxuryScore: context?.luxuryScore,
    compositionScore: context?.compositionScore,
    sceneScore: context?.sceneScore,
  });
}

/** Backward-compatible wrapper — returns compiled positive prompt only */
export function buildSceneBackgroundPrompt(
  scene: ScenePlan,
  analysis: ProductAnalysis,
  context?: ScenePromptContext,
): string {
  return compileSceneRenderingPrompt(scene, analysis, context).prompt;
}

/** Negative prompt from compiler (zone-aware) */
export function buildSceneNegativeHints(
  scene: ScenePlan,
  analysis: ProductAnalysis,
  context?: Omit<ScenePromptContext, "prompt">,
): string {
  return compileSceneRenderingPrompt(scene, analysis, {
    ...context,
    prompt: "",
  }).negativePrompt;
}
