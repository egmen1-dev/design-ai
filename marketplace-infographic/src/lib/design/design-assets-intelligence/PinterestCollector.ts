import type { ReferenceImageMeta } from "./types";
import { PINTEREST_SEARCH_QUERIES } from "./config";

/** Pinterest — референсы для анализа, не готовые элементы */
export async function collectPinterestReferences(
  extraQueries: string[] = [],
): Promise<ReferenceImageMeta[]> {
  const queries = [...PINTEREST_SEARCH_QUERIES, ...extraQueries];
  const refs: ReferenceImageMeta[] = [];

  for (const query of queries) {
    refs.push({
      source: "pinterest",
      query,
      title: `Pinterest reference: ${query}`,
      url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`,
    });
  }

  return refs;
}
