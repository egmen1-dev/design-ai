import {
  DEFAULT_STYLE,
  STYLE_KEYS,
  type InfographicStyle,
} from "@/lib/design-trends";
import type { InfographicSdInput } from "@/lib/validations";
import type { DesignExampleRecord } from "@/lib/select-relevant-examples";
import { expandQueryTerms, termsMatch } from "@/lib/query-terms";

export type ScoredExample = {
  example: DesignExampleRecord;
  score: number;
};

export type ReferenceBlueprint = {
  layout: "marketplace";
  titleCase: boolean;
  subtitlePill: boolean;
  leftStatCards: boolean;
  rightVerticalBar: boolean;
  productDiagonal: boolean;
  dominantColors: string[];
};

export type ResolvedReferenceContext = {
  hasStrongReference: boolean;
  layout: InfographicSdInput["layout"];
  style: InfographicStyle;
  colors: string[] | null;
  blueprint: ReferenceBlueprint | null;
  topExample: DesignExampleRecord | null;
  compositionHint: string | null;
};

const STRONG_MATCH_SCORE = 3;

function parseStyle(value: string | null | undefined, fallback: InfographicStyle): InfographicStyle {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return STYLE_KEYS.includes(normalized as InfographicStyle)
    ? (normalized as InfographicStyle)
    : fallback;
}

function parseResultJson(example: DesignExampleRecord): Record<string, unknown> {
  try {
    return JSON.parse(example.resultJson) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function pickAccentColors(example: DesignExampleRecord): string[] | null {
  const parsed = parseResultJson(example);
  const fromBlueprint = parsed.layoutBlueprint as ReferenceBlueprint | undefined;
  if (fromBlueprint?.dominantColors?.length) {
    return fromBlueprint.dominantColors.slice(0, 3);
  }

  const dominant = parsed.dominantColors;
  if (Array.isArray(dominant) && dominant.every((c) => typeof c === "string")) {
    return dominant.slice(0, 3);
  }

  return null;
}

function pickBlueprint(example: DesignExampleRecord): ReferenceBlueprint | null {
  const parsed = parseResultJson(example);
  const blueprint = parsed.layoutBlueprint;
  if (blueprint && typeof blueprint === "object") {
    const b = blueprint as Partial<ReferenceBlueprint>;
    if (b.layout === "marketplace") {
      return {
        layout: "marketplace",
        titleCase: b.titleCase ?? true,
        subtitlePill: b.subtitlePill ?? true,
        leftStatCards: b.leftStatCards ?? true,
        rightVerticalBar: b.rightVerticalBar ?? true,
        productDiagonal: b.productDiagonal ?? true,
        dominantColors: Array.isArray(b.dominantColors)
          ? b.dominantColors.filter((c): c is string => typeof c === "string").slice(0, 5)
          : [],
      };
    }
  }

  if (parsed.type === "reference_card" && example.imageUrl) {
    return {
      layout: "marketplace",
      titleCase: true,
      subtitlePill: true,
      leftStatCards: true,
      rightVerticalBar: true,
      productDiagonal: true,
      dominantColors: pickAccentColors(example) ?? [],
    };
  }

  return null;
}

export function scoreExamples(
  prompt: string,
  pool: DesignExampleRecord[],
  style?: InfographicStyle,
): ScoredExample[] {
  const words = expandQueryTerms(prompt);

  return pool
    .map((example) => {
      const haystack = `${example.prompt} ${example.notes ?? ""} ${example.tags.join(" ")} ${example.appliedStyle}`;
      let score = 0;

      for (const word of words) {
        if (termsMatch(haystack, word)) score += 1;
      }

      for (const tag of example.tags) {
        if (words.some((word) => termsMatch(tag, word))) score += 2;
        if (words.some((word) => termsMatch(haystack, tag))) score += 1;
      }

      if (style && example.appliedStyle === style) score += 4;
      if (style && example.tags.includes(style)) score += 2;
      if (example.imageUrl) score += 2;

      const parsed = parseResultJson(example);
      const synonyms = Array.isArray(parsed.synonyms)
        ? parsed.synonyms.filter((s): s is string => typeof s === "string")
        : [];
      for (const syn of synonyms) {
        if (words.some((w) => syn.toLowerCase().includes(w))) score += 2;
      }

      return { example, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score || b.example.createdAt.getTime() - a.example.createdAt.getTime(),
    );
}

export function resolveReferenceContext(
  prompt: string,
  userStyle: InfographicStyle,
  examples: DesignExampleRecord[],
): ResolvedReferenceContext {
  if (examples.length === 0) {
    return {
      hasStrongReference: false,
      layout: "marketplace",
      style: userStyle,
      colors: null,
      blueprint: null,
      topExample: null,
      compositionHint: null,
    };
  }

  const scored = scoreExamples(prompt, examples, userStyle);
  const top = scored[0];
  const hasStrongReference = Boolean(top && top.score >= STRONG_MATCH_SCORE);
  const topExample = top?.example ?? null;

  if (!hasStrongReference || !topExample) {
    const colors = topExample ? pickAccentColors(topExample) : null;
    return {
      hasStrongReference: false,
      layout: "marketplace",
      style: userStyle,
      colors,
      blueprint: topExample ? pickBlueprint(topExample) : null,
      topExample,
      compositionHint: null,
    };
  }

  const blueprint = pickBlueprint(topExample);
  const colors = pickAccentColors(topExample);
  const parsed = parseResultJson(topExample);

  const compositionHint =
    topExample.notes ??
    (typeof parsed.compositionNotes === "string" ? parsed.compositionNotes : null) ??
    (typeof parsed.notes === "string" ? parsed.notes : null);

  return {
    hasStrongReference: true,
    layout: "marketplace",
    style: parseStyle(topExample.appliedStyle, userStyle),
    colors,
    blueprint,
    topExample,
    compositionHint,
  };
}

export function applyReferenceToSdData(
  data: InfographicSdInput,
  ref: ResolvedReferenceContext,
): InfographicSdInput {
  if (!ref.hasStrongReference) {
    const next: InfographicSdInput = { ...data, layout: ref.layout };
    if (ref.colors && ref.colors.length >= 2) {
      next.colors = [
        ref.colors[0],
        ref.colors[1] ?? ref.colors[0],
        ref.colors[2] ?? "#0f172a",
      ];
    }
    return next;
  }

  const next: InfographicSdInput = {
    ...data,
    layout: ref.layout,
  };

  if (ref.colors && ref.colors.length >= 2) {
    next.colors = [
      ref.colors[0],
      ref.colors[1] ?? ref.colors[0],
      ref.colors[2] ?? "#0f172a",
    ];
  }

  if (ref.topExample?.fontId) next.fontId = ref.topExample.fontId;
  if (ref.topExample?.badgeId) next.badgeId = ref.topExample.badgeId;

  return next;
}

export function defaultMarketplaceColors(): string[] {
  return ["#00a8b5", "#ffffff", "#0f172a"];
}
