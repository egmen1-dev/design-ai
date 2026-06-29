import type { PromptCompilerInput } from "./types";

const BASE_NEGATIVE = [
  "low quality",
  "oversaturated",
  "floating object",
  "busy composition",
  "messy background",
  "random objects",
  "too many icons",
  "poor lighting",
  "cropped product",
  "text artifacts",
  "extra decorative elements",
  "AI-looking composition",
  "flat lighting",
  "placeholder shapes",
  "low contrast",
  "blurry",
  "watermark",
  "logo",
  "typography",
  "words",
  "letters",
  "product in background",
  "duplicate objects",
  "cluttered",
  "particles",
  "unnecessary gradients",
  "perfect symmetry accident",
  "dead center floating cutout",
];

export function compileNegativePrompt(input: PromptCompilerInput): string {
  const extra: string[] = [];
  if (input.layoutSpec?.maxDecorativeObjects === 0) {
    extra.push("decorative shapes", "glow effects", "lens flare");
  }
  if (input.sceneBlueprint?.decorative.maxParticles === 0) {
    extra.push("particles", "sparkles", "dust");
  }
  for (const zone of input.scenePlan.textSafeZones) {
    extra.push(`objects in ${zone.purpose} area`);
  }
  return [...new Set([...BASE_NEGATIVE, ...extra])].join(", ");
}
