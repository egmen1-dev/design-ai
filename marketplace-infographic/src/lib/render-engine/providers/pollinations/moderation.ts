/**
 * Pollinations content-moderation helpers.
 * Product/industrial prompts (generators, workshops, Cyrillic) often trip the filter.
 */

export const BARE_MINIMAL_PROMPT =
  "soft grey studio cyclorama backdrop, empty center, commercial product photography, no text";

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

const SAFE_STUDIO_SUFFIX =
  "empty foreground for product compositing, backdrop only, no objects in product zone, no text, no letters, no watermark";

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

/**
 * Level 0 — light pass at compile time (keep scene detail).
 * Level 1 — strip scripts + replace trigger terms.
 * Level 2 — minimal safe studio prompt (drops scene narrative).
 */
export function sanitizePromptForModeration(
  prompt: string,
  level: 0 | 1 | 2 = 1,
): string {
  if (level === 2) {
    return buildModerationFallbackPrompt();
  }

  let out = stripNonLatinScript(prompt);
  out = applyTriggerReplacements(out);

  if (level === 0) {
    return out;
  }

  // Level 1: keep photography modules but drop long environment clauses
  const parts = out
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !/\b(rugged|grime|steel|concrete|garage|outdoor sunset)\b/i.test(p));

  const condensed = parts.slice(0, 8).join(", ");
  if (condensed.length < 40) {
    return buildModerationFallbackPrompt();
  }
  return `${SAFE_STUDIO_PREFIX}, ${condensed}, ${SAFE_STUDIO_SUFFIX}`;
}

export function buildModerationFallbackPrompt(hints?: {
  atmosphere?: string;
  environment?: string;
}): string {
  const mood = hints?.atmosphere
    ? applyTriggerReplacements(stripNonLatinScript(hints.atmosphere))
    : "neutral premium";
  const env = hints?.environment
    ? applyTriggerReplacements(stripNonLatinScript(hints.environment))
    : "soft grey gradient backdrop";

  return [
    SAFE_STUDIO_PREFIX,
    `${mood} atmosphere`,
    `${env}, professional advertising lighting`,
    "photorealistic commercial photography, 70mm lens, soft key light",
    SAFE_STUDIO_SUFFIX,
  ].join(", ");
}

/** Build escalating prompt variants for moderation retries. */
export function buildModerationPromptVariants(
  prompt: string,
  hints?: { atmosphere?: string; environment?: string },
): string[] {
  const variants = [
    sanitizePromptForModeration(prompt, 0),
    sanitizePromptForModeration(prompt, 1),
    sanitizePromptForModeration(prompt, 2),
    buildModerationFallbackPrompt(hints),
  ];
  return [...new Set(variants)];
}
