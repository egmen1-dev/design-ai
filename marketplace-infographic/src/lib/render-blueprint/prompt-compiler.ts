/**
 * Chapter 3.11 — Prompt Compiler (Render Adapter only — no other component may create prompts)
 */
import type { ProviderId, RenderIntent } from "./render-pipeline-types";

export const BANNED_PROMPT_TERMS =
  /\b(hero coverage|law_003|blueprint|ctr|quality gate|layoutspec|marketplace score|professional score|badge priority|whitespace target|visual hierarchy|click.?through)\b/gi;

const ENVIRONMENT_PHRASE: Record<string, string> = {
  kitchen: "modern kitchen interior",
  bathroom: "clean bathroom interior",
  garage: "garage workshop interior",
  garden: "outdoor garden setting",
  living_room: "living room interior",
  studio: "professional photo studio",
  workshop: "workshop interior",
};

const LIGHTING_PHRASE: Record<string, string> = {
  studio: "controlled studio lighting",
  window: "soft window light",
  golden_hour: "warm golden hour light",
  softbox: "softbox studio lighting",
  overcast: "soft overcast daylight",
};

const TEMPLATE_PHRASE: Record<string, string> = {
  hero_left: "composition with open space on the left",
  hero_right: "composition with open space on the right",
  center: "centered product composition",
};

function sanitizePrompt(text: string): string {
  return text
    .replace(BANNED_PROMPT_TERMS, "")
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*,/g, ",")
    .trim();
}

function baseSegments(intent: RenderIntent, includeComposition = true): string[] {
  const env = ENVIRONMENT_PHRASE[intent.scene.environment] ?? intent.scene.environment;
  const lens = intent.camera.focalLength ?? intent.camera.lens;
  const lightingDesc =
    intent.lighting.lightingScheme?.replace(/_/g, " ") ??
    LIGHTING_PHRASE[intent.lighting.preset] ??
    intent.lighting.preset;
  const contactSurface = intent.materials.contactSurface?.replace(/_/g, " ");
  const segments = [
    `${env}, ${intent.scene.architecture} architecture`,
    `${intent.scene.timeOfDay.replace("_", " ")} atmosphere`,
    contactSurface
      ? `${intent.materials.floor} on ${contactSurface}`
      : `${intent.materials.floor} floor, ${intent.materials.walls} walls`,
    lightingDesc,
    `${lens}mm lens, ${intent.camera.distance} distance, ${intent.camera.angle} angle`,
    intent.mood || "clean commercial atmosphere",
    "empty foreground for product compositing, backdrop only, no product, no text",
  ];
  if (includeComposition) {
    segments.push(TEMPLATE_PHRASE[intent.composition.template] ?? "balanced commercial framing");
  }
  return segments.filter(Boolean);
}

/** FLUX — short photographic English, no marketplace terms */
export function compileFluxPrompt(intent: RenderIntent): string {
  const prompt = sanitizePrompt(baseSegments(intent).join(", "));
  return prompt.slice(0, 900);
}

/** GPT Image — fuller natural language scene description */
export function compileGptImagePrompt(intent: RenderIntent): string {
  const env = ENVIRONMENT_PHRASE[intent.scene.environment] ?? intent.scene.environment;
  const paragraph = sanitizePrompt(
    `Commercial product photography backdrop. ${env} with ${intent.scene.architecture} style. ` +
      `Lighting: ${LIGHTING_PHRASE[intent.lighting.preset] ?? intent.lighting.preset}. ` +
      `Camera: ${intent.camera.lens}mm lens at ${intent.camera.distance} distance. ` +
      `Mood: ${intent.mood}. Materials: ${intent.materials.floor} floor and ${intent.materials.walls} walls. ` +
      `Leave clean empty space for product placement. No text, logos, or people.`,
  );
  return paragraph.slice(0, 1200);
}

/** SDXL — classic positive prompt */
export function compileSdxlPrompt(intent: RenderIntent): string {
  return compileFluxPrompt(intent);
}

/** Pollinations — API-safe compressed prompt */
export function compilePollinationsPromptFromIntent(intent: RenderIntent): string {
  const priority = [
    ENVIRONMENT_PHRASE[intent.scene.environment] ?? intent.scene.environment,
    "empty foreground for product compositing, backdrop only",
  ];
  const optional = baseSegments(intent).slice(2, 7);
  const combined = sanitizePrompt([...priority, ...optional].join(", "));
  const words = combined.split(/\s+/);
  return words.slice(0, 110).join(" ");
}

export function compilePromptForProvider(intent: RenderIntent, provider: ProviderId): string {
  switch (provider) {
    case "gpt-image":
      return compileGptImagePrompt(intent);
    case "sdxl":
      return compileSdxlPrompt(intent);
    case "pollinations":
      return compilePollinationsPromptFromIntent(intent);
    case "flux":
    case "imagen":
    default:
      return compileFluxPrompt(intent);
  }
}

export function validateCompiledPrompt(prompt: string): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!prompt.trim()) issues.push("empty prompt");
  if (BANNED_PROMPT_TERMS.test(prompt)) issues.push("contains banned Design AI terms");
  if (/\bx\s*=\s*[\d.]+/i.test(prompt)) issues.push("contains coordinates");
  if (/\b\d+(\.\d+)?%\b/.test(prompt)) issues.push("contains layout percentages");
  return { ok: issues.length === 0, issues };
}
