/**
 * Pollinations content-moderation helpers.
 * Product/industrial prompts (generators, workshops, Cyrillic) often trip the filter.
 */

import type { CoverConceptId } from "@/lib/cover-concepts";
import {
  isOutdoorCoverConcept,
  resolveCoverConceptVisualHints,
} from "@/lib/design/visual-pipeline/catalogs/cover-concept";

export const BARE_MINIMAL_PROMPT =
  "soft grey studio cyclorama backdrop, empty center, commercial product photography, no text";

export const BARE_OUTDOOR_MINIMAL_PROMPT =
  "sunny suburban lawn backdrop, garden path blurred, clear empty grass foreground, commercial product photography, no text";

export type ModerationSceneHints = {
  atmosphere?: string;
  environment?: string;
  coverConceptId?: CoverConceptId;
};

export class PollinationsModelBlockedError extends Error {
  readonly modelId: string;
  constructor(modelId: string, detail: string) {
    super(`Pollinations model blocked: ${modelId} — ${detail.slice(0, 120)}`);
    this.name = "PollinationsModelBlockedError";
    this.modelId = modelId;
  }
}

export function isPollinationsModelBlockedError(err: unknown): boolean {
  return err instanceof PollinationsModelBlockedError;
}

const MODERATION_ERROR_RE =
  /content moderation|moderation|safety filter|policy violation|inappropriate content|request was rejected/i;

/** Terms that often trigger Pollinations moderation in product-ad context */
const TRIGGER_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bindustrial\b/gi, "professional"],
  [/\bworkshop\b/gi, "studio"],
  [/\bconstruction\b/gi, "commercial"],
  [/\bwarehouse\b/gi, "studio space"],
  [/\bgenerator\b/gi, "power equipment"],
  [/\bgenerators\b/gi, "power equipment"],
  [/\bгенератор\w*/gi, "power equipment"],
  [/\bбензинов\w*/gi, "portable"],
  [/\bдизельн\w*/gi, "portable"],
  [/\bgasoline\b/gi, "portable"],
  [/\bdiesel\b/gi, "portable"],
  [/\bfuel\b/gi, "energy"],
  [/\bpetrol\b/gi, "portable"],
  [/\bexplosive\b/gi, "dynamic"],
  [/\bweapon\b/gi, "equipment"],
  [/\bweapons\b/gi, "equipment"],
  [/\bgun\b/gi, "tool"],
  [/\bknife\b/gi, "utensil"],
  [/\bblood\b/gi, "red accent"],
  [/\bviolence\b/gi, "energy"],
  [/\bwar\b/gi, "commercial"],
  [/\bnude\b/gi, "neutral"],
  [/\bsexy\b/gi, "elegant"],
  [/\bdrug\b/gi, "wellness"],
];

const SAFE_STUDIO_PREFIX =
  "ultra realistic commercial product photography background, soft studio cyclorama";

const SAFE_OUTDOOR_PREFIX =
  "ultra realistic outdoor commercial product photography background";

const SAFE_STUDIO_SUFFIX =
  "empty foreground for product compositing, backdrop only, no objects in product zone, no text, no letters, no watermark";

const LEVEL1_DROP_RE = /\b(rugged|grime|steel|concrete|garage)\b/i;
const LEVEL1_DROP_OUTDOOR_ONLY_RE = /\boutdoor sunset\b/i;

export function isPollinationsModerationError(body: string): boolean {
  return MODERATION_ERROR_RE.test(body);
}

/** Remove Cyrillic and collapse whitespace — Latin-only prompts pass moderation more often. */
export function stripNonLatinScript(text: string): string {
  return text
    .replace(/[\u0400-\u04FF\u0600-\u06FF\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function applyTriggerReplacements(text: string): string {
  let out = text;
  for (const [pattern, replacement] of TRIGGER_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, " ").trim();
}

function moderationPrefix(hints?: ModerationSceneHints): string {
  return isOutdoorCoverConcept(hints?.coverConceptId)
    ? SAFE_OUTDOOR_PREFIX
    : SAFE_STUDIO_PREFIX;
}

function coverEnvironmentFallback(hints?: ModerationSceneHints): string | undefined {
  return resolveCoverConceptVisualHints(hints?.coverConceptId)?.environmentPhrase;
}

/**
 * Level 0 — light pass at compile time (keep scene detail).
 * Level 1 — strip scripts + replace trigger terms.
 * Level 2 — minimal safe prompt (drops scene narrative).
 */
export function sanitizePromptForModeration(
  prompt: string,
  level: 0 | 1 | 2 = 1,
  hints?: ModerationSceneHints,
): string {
  const outdoor = isOutdoorCoverConcept(hints?.coverConceptId);

  if (level === 2) {
    return buildModerationFallbackPrompt(hints);
  }

  let out = stripNonLatinScript(prompt);
  out = applyTriggerReplacements(out);

  if (level === 0) {
    return out;
  }

  // Level 1: keep photography modules; preserve outdoor clauses when coverConcept is outdoor
  const parts = out
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => {
      if (LEVEL1_DROP_RE.test(p)) return false;
      if (!outdoor && LEVEL1_DROP_OUTDOOR_ONLY_RE.test(p)) return false;
      return true;
    });

  const condensed = parts.slice(0, 8).join(", ");
  if (condensed.length < 40) {
    return buildModerationFallbackPrompt(hints);
  }
  return `${moderationPrefix(hints)}, ${condensed}, ${SAFE_STUDIO_SUFFIX}`;
}

export function buildModerationFallbackPrompt(hints?: ModerationSceneHints): string {
  const outdoor = isOutdoorCoverConcept(hints?.coverConceptId);
  const coverPhrase = coverEnvironmentFallback(hints);

  const mood = hints?.atmosphere
    ? applyTriggerReplacements(stripNonLatinScript(hints.atmosphere))
    : outdoor
      ? "warm natural"
      : "neutral premium";
  const env = hints?.environment
    ? applyTriggerReplacements(stripNonLatinScript(hints.environment))
    : coverPhrase
      ? coverPhrase.slice(0, 120)
      : outdoor
        ? "sunny lawn and garden path, blurred wooden fence"
        : "soft grey gradient backdrop";

  return [
    moderationPrefix(hints),
    `${mood} atmosphere`,
    `${env}, professional advertising lighting`,
    "photorealistic commercial photography, 70mm lens, soft key light",
    SAFE_STUDIO_SUFFIX,
  ].join(", ");
}

/** Last-resort prompt when all moderation variants fail */
export function resolveBareMinimalPrompt(hints?: ModerationSceneHints): string {
  if (isOutdoorCoverConcept(hints?.coverConceptId)) {
    const coverPhrase = coverEnvironmentFallback(hints);
    return coverPhrase
      ? `${coverPhrase}, empty center, commercial product photography, no text`
      : BARE_OUTDOOR_MINIMAL_PROMPT;
  }
  return BARE_MINIMAL_PROMPT;
}

/** Build escalating prompt variants for moderation retries. */
export function buildModerationPromptVariants(
  prompt: string,
  hints?: ModerationSceneHints,
): string[] {
  const variants = [
    sanitizePromptForModeration(prompt, 0, hints),
    sanitizePromptForModeration(prompt, 1, hints),
    sanitizePromptForModeration(prompt, 2, hints),
    buildModerationFallbackPrompt(hints),
  ];
  return [...new Set(variants)];
}
