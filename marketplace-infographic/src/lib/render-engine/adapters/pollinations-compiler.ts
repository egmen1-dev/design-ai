/**
 * Pollinations Adapter — sole module that translates VisualSceneBlueprint → prompt strings.
 * Agents never generate prompt text.
 */
import { resolveLighting } from "@/lib/design/scene-blueprint/lighting";
import { MATERIAL_PROFILES } from "@/lib/design/scene-blueprint/materials";
import type { VisualSceneBlueprint } from "@/lib/design/visual-pipeline/types";
import {
  ARCHITECTURE_VISUAL,
  DEPTH_VISUAL,
  MOOD_VISUAL,
  TIME_VISUAL,
  WEATHER_VISUAL,
} from "@/lib/design/visual-pipeline/catalogs/environment";
import type { CoverConceptId } from "@/lib/cover-concepts";
import { resolveCoverConceptVisualHints } from "@/lib/design/visual-pipeline/catalogs/cover-concept";
import { sanitizePromptForModeration } from "../providers/pollinations/moderation";

const BACKDROP =
  "empty foreground for product compositing, backdrop only, no objects, no text, no letters, no watermark";

const BANNED_PHRASES =
  /\b(ctr|typography safe zone|visual hierarchy|layout percent|marketing hook|conversion|click.?through)\b/gi;

const LIGHT_KEY: Record<string, string> = {
  soft: "soft diffused key light",
  directional: "directional key light",
  spot: "focused spotlight",
  overhead: "overhead product key light",
};

const LIGHT_FILL: Record<string, string> = {
  minimal: "minimal fill",
  balanced: "balanced ambient fill",
  ambient: "soft ambient fill",
};

const LIGHT_RIM: Record<string, string> = {
  none: "",
  subtle: "subtle rim separation",
  strong: "strong edge rim light",
};

const CAMERA_ANGLE: Record<string, string> = {
  eye_level: "eye level",
  low_hero: "low hero angle",
  three_quarter: "three-quarter view",
  top_down: "overhead framing",
};

const NEGATIVE_SPACE: Record<string, string> = {
  left: "large clean empty space on left",
  right: "large clean empty space on right",
  top: "large clean empty space on top",
  balanced: "balanced clean negative space",
};

export type PollinationsCompiledPrompt = {
  prompt: string;
  negativePrompt: string;
  tokenEstimate: number;
  modulesUsed: string[];
  validation: PollinationsPromptValidation;
};

export type PollinationsPromptValidation = {
  ok: boolean;
  issues: string[];
  length: number;
};

export function validatePollinationsPrompt(prompt: string, negative: string): PollinationsPromptValidation {
  const issues: string[] = [];
  if (prompt.length > 900) issues.push("prompt too long");
  if (BANNED_PHRASES.test(prompt)) issues.push("unsupported marketing/designer language");
  if (/\b\d+(\.\d+)?%\b/.test(prompt)) issues.push("layout percentages not supported");
  if (/\bx\s*=\s*0\./i.test(prompt)) issues.push("coordinates not supported");
  const dup = prompt.toLowerCase().split(/,\s*/).filter((p, i, a) => a.indexOf(p) !== i);
  if (dup.length) issues.push("duplicated instructions");
  if (/product in foreground/i.test(prompt)) issues.push("contradicts backdrop-only rule");
  return {
    ok: issues.length === 0,
    issues,
    length: prompt.length,
  };
}

function estimateTokens(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function compressSegments(segments: string[], maxTokens = 110): string {
  const kept: string[] = [];
  let tokens = 0;
  for (const seg of segments) {
    const t = estimateTokens(seg);
    if (tokens + t > maxTokens) break;
    kept.push(seg);
    tokens += t;
  }
  return kept.join(", ");
}

/** Priority segments always included; optional segments fill remaining token budget */
function compilePromptSegments(
  priority: string[],
  optional: string[],
  maxTokens = 110,
): string {
  const kept: string[] = [];
  let tokens = 0;
  for (const seg of [...priority, ...optional].filter(Boolean)) {
    const t = estimateTokens(seg);
    if (tokens + t > maxTokens) {
      if (kept.length === 0) kept.push(seg.split(/\s+/).slice(0, maxTokens).join(" "));
      break;
    }
    kept.push(seg);
    tokens += t;
  }
  return kept.join(", ");
}

export type PollinationsCompileOptions = {
  coverConceptId?: CoverConceptId;
  profileLabel?: string;
  environmentPhraseOverride?: string;
};

/** Compile VisualSceneBlueprint → Pollinations-optimized prompt (80–120 tokens) */
export function compilePollinationsPrompt(
  blueprint: VisualSceneBlueprint,
  profileLabel = "commercial",
  options?: PollinationsCompileOptions,
): PollinationsCompiledPrompt {
  const coverConceptId = options?.coverConceptId;
  const coverHints = resolveCoverConceptVisualHints(coverConceptId);
  const lighting = resolveLighting(blueprint.lighting.preset);
  const floor = MATERIAL_PROFILES[blueprint.materials.floor];

  const environmentPhrase =
    options?.environmentPhraseOverride?.trim() ||
    coverHints?.environmentPhrase ||
    ARCHITECTURE_VISUAL[blueprint.scene.architecture];

  const priority = [
    environmentPhrase,
    BACKDROP,
    "sharp detailed floor plane in foreground",
  ];

  const optional = [
    coverHints ? null : "Premium commercial advertising background",
    WEATHER_VISUAL[blueprint.scene.weather],
    TIME_VISUAL[blueprint.scene.time],
    DEPTH_VISUAL[blueprint.scene.depth],
    MOOD_VISUAL[blueprint.mood] ?? "professional atmosphere",
    LIGHT_KEY[blueprint.lighting.keyLight] ?? lighting.key,
    LIGHT_FILL[blueprint.lighting.fill] ?? lighting.fill,
    LIGHT_RIM[blueprint.lighting.rim] ?? "",
    `${blueprint.lighting.temperatureK}K color temperature`,
    `${blueprint.camera.lensMm}mm lens`,
    CAMERA_ANGLE[blueprint.camera.angle] ?? "eye level",
    floor.atmosphere,
    NEGATIVE_SPACE[blueprint.composition.negativeSpace],
  ].filter(Boolean) as string[];

  let prompt = compilePromptSegments(priority, optional, 110);
  prompt = sanitizePromptForModeration(prompt.replace(BANNED_PHRASES, " "), 0, {
    coverConceptId: options?.coverConceptId,
  });

  const negativePrompt = blueprint.negative.terms.slice(0, 12).join(", ");
  const validation = validatePollinationsPrompt(prompt, negativePrompt);

  return {
    prompt,
    negativePrompt,
    tokenEstimate: estimateTokens(prompt),
    modulesUsed: ["scene", "lighting", "environment", "camera", "materials", "composition"],
    validation,
  };
}
