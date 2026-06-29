import type { ReferenceImageMeta } from "./types";
import { DRIBBBLE_QUERIES } from "./config";

export async function collectDribbbleReferences(): Promise<ReferenceImageMeta[]> {
  return DRIBBBLE_QUERIES.map((query) => ({
    source: "dribbble",
    query,
    title: `Dribbble: ${query}`,
    url: `https://dribbble.com/search/${encodeURIComponent(query)}`,
  }));
}
