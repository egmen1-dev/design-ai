import type { ReferenceImageMeta } from "./types";
import { BEHANCE_QUERIES } from "./config";

export async function collectBehanceReferences(): Promise<ReferenceImageMeta[]> {
  return BEHANCE_QUERIES.map((query) => ({
    source: "behance",
    query,
    title: `Behance: ${query}`,
    url: `https://www.behance.net/search/projects?search=${encodeURIComponent(query)}`,
  }));
}
