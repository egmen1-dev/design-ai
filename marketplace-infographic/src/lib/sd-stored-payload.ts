import { DEFAULT_STYLE, STYLE_KEYS, type InfographicStyle } from "@/lib/design-trends";
import { infographicSdSchema, type InfographicSdInput } from "@/lib/validations";

export type StoredSdPayload = {
  data: InfographicSdInput;
  style: InfographicStyle;
};

export function packSdPayload(
  data: InfographicSdInput,
  style: InfographicStyle,
): string {
  return JSON.stringify({ data, style } satisfies StoredSdPayload);
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
    return { data: infographicSdSchema.parse(record.data), style };
  }
  return {
    data: infographicSdSchema.parse(parsed),
    style: DEFAULT_STYLE,
  };
}
