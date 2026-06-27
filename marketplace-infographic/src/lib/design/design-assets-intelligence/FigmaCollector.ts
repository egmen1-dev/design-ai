import type { ReferenceImageMeta } from "./types";
import { FIGMA_COMMUNITY_TAGS } from "./config";

export async function collectFigmaReferences(): Promise<ReferenceImageMeta[]> {
  return FIGMA_COMMUNITY_TAGS.map((tag) => ({
    source: "figma",
    query: tag,
    title: `Figma Community: ${tag}`,
    url: `https://www.figma.com/community/search?query=${encodeURIComponent(tag)}`,
  }));
}
