import type { LayoutSpec } from "@/lib/design/layout-spec";

const BASE_NEGATIVE = [
  "low quality",
  "oversaturated",
  "floating object",
  "busy composition",
  "messy background",
  "random objects",
  "text",
  "words",
  "letters",
  "typography",
  "watermark",
  "logo",
  "product",
  "equipment",
  "clutter",
  "particles",
  "blurry",
  "AI artifacts",
];

export function compileNegativeTerms(input: {
  layoutSpec?: LayoutSpec;
  profileExtras?: string[];
}): string[] {
  const extra: string[] = [...(input.profileExtras ?? [])];
  if (input.layoutSpec?.maxDecorativeObjects === 0) {
    extra.push("decorative shapes", "glow effects", "lens flare");
  }
  return [...new Set([...BASE_NEGATIVE, ...extra])];
}

export function joinNegativeTerms(terms: string[]): string {
  return terms.join(", ");
}
