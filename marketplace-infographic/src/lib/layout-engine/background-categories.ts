import { resolveArtDirector } from "@/lib/design-process/category-art-directors";

const FORBIDDEN_KEYWORDS: Record<string, string[]> = {
  generator: ["гостин", "офис", "спальн", "детск", "living room", "bedroom", "office"],
};

export function isEnvironmentAllowed(category: import("@/lib/product-analysis").ProductCategory, env: string): boolean {
  const director = resolveArtDirector(category, env);
  const lower = env.toLowerCase();

  for (const forbidden of director.forbiddenScenes) {
    const key = forbidden.split(" ")[0]?.toLowerCase();
    if (key && lower.includes(key)) return false;
  }

  if (/генератор|generator|квт/i.test(env)) {
    for (const kw of FORBIDDEN_KEYWORDS.generator) {
      if (lower.includes(kw)) return false;
    }
  }

  return true;
}

export function pickAllowedEnvironment(
  category: import("@/lib/product-analysis").ProductCategory,
  prompt: string,
  seed: string,
): string {
  const director = resolveArtDirector(category, prompt);
  const idx = seed.length % director.sceneEnvironments.length;
  return director.sceneEnvironments[idx] ?? director.sceneEnvironments[0];
}
