import type { InfographicStyle } from "@/lib/design-trends";
import {
  PRODUCT_BG_NEGATIVE,
  stripProductFromBackgroundPrompt,
} from "@/lib/product-render-policy";

const STYLE_SCENE: Record<InfographicStyle, string> = {
  brutalism:
    "raw concrete urban wall, high contrast, harsh daylight, bold geometric shadows, industrial yard, yellow and black accents in environment",
  glassmorphism:
    "soft bokeh city lights through frosted glass, cool blue purple tones, dreamy blur, premium ecommerce backdrop",
  minimal:
    "clean white studio cyclorama, soft neutral gradient, minimal props, lots of negative space, scandinavian aesthetic",
  modern:
    "suburban garden with lush green grass, modern house bokeh, soft natural daylight, lifestyle product photography",
  neumorphism:
    "soft gray studio with subtle sculpted shapes, diffused light, matte surfaces, calm premium mood",
  "3d":
    "surreal colorful studio with depth, dramatic rim light, vibrant purple and gold atmosphere, cinematic",
  retro:
    "warm vintage living room, film grain, orange teal tones, nostalgic 80s interior soft focus",
  swiss:
    "strict grid-inspired studio, bold red accent wall section, white space, editorial product photography",
};

const VARIATION_WORDS = [
  "morning light",
  "golden hour",
  "overcast soft light",
  "side lighting",
  "wide angle",
  "shallow depth of field",
  "different camera angle",
  "alternate composition",
];

export function seedToNumber(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 2_147_483_647 || 42;
}

export function enrichBackgroundPrompt(
  prompt: string,
  style: InfographicStyle,
  variationSeed: string,
): string {
  const scene = STYLE_SCENE[style];
  const variation =
    VARIATION_WORDS[seedToNumber(variationSeed) % VARIATION_WORDS.length];
  const base = stripProductFromBackgroundPrompt(prompt.trim().replace(/\s+/g, " "));
  return `${base}, ${scene}, ${variation}, empty center foreground clear grass only, ${PRODUCT_BG_NEGATIVE}, unique scene variation ${variationSeed.slice(-8)}`;
}
