const layoutBoost = new Map<string, number>();

export function refreshTrendLayoutCache(
  category: string,
  rising: string[],
  declining: string[],
): void {
  for (const layout of rising) {
    layoutBoost.set(`${category}:${layout}`, 10);
  }
  for (const layout of declining) {
    layoutBoost.set(`${category}:${layout}`, -8);
  }
}

export function getTrendIntelligenceLayoutBoost(category: string, layoutTemplate: string): number {
  return layoutBoost.get(`${category}:${layoutTemplate}`) ?? 0;
}
