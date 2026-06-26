import { DEFAULT_STYLE, STYLE_KEYS, type InfographicStyle } from "@/lib/design-trends";
import type { CompositingHints, DesignBrief } from "@/lib/design-brief/schema";
import type { InfographicSdInput } from "@/lib/validations";
import { sanitizeSdInput } from "@/lib/sd-sanitize";

export type StoredSdPayload = {
  data: InfographicSdInput;
  style: InfographicStyle;
  brief?: DesignBrief;
  compositingHints?: CompositingHints;
  qualityScore?: number;
};

export function packSdPayload(
  data: InfographicSdInput,
  style: InfographicStyle,
  extras?: {
    brief?: DesignBrief;
    compositingHints?: CompositingHints;
    qualityScore?: number;
  },
): string {
  return JSON.stringify({
    data,
    style,
    brief: extras?.brief,
    compositingHints: extras?.compositingHints,
    qualityScore: extras?.qualityScore,
  } satisfies StoredSdPayload);
}

export function unpackSdPayload(json: string): StoredSdPayload {
  const parsed = JSON.parse(json) as unknown;
  if (
    parsed &&
    typeof parsed === "object" &&
    "data" in parsed &&
    "style" in parsed
  ) {
    const record = parsed as StoredSdPayload;
    const style = STYLE_KEYS.includes(record.style as InfographicStyle)
      ? (record.style as InfographicStyle)
      : DEFAULT_STYLE;
    return {
      data: sanitizeSdInput(record.data),
      style,
      brief: record.brief,
      compositingHints: record.compositingHints,
      qualityScore: record.qualityScore,
    };
  }
  return {
    data: sanitizeSdInput(parsed),
    style: DEFAULT_STYLE,
  };
}
