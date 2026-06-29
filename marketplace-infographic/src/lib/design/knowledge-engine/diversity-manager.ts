import type { DesignPattern } from "@prisma/client";
import {
  DIVERSITY_OVERUSE_THRESHOLD,
  DIVERSITY_WINDOW,
  type KnowledgeCategory,
} from "./types";

const recentUsage = new Map<string, string[]>();

function usageKey(category: KnowledgeCategory, dimension: string, value: string): string {
  return `${category}:${dimension}:${value}`;
}

export function trackRecentUsage(category: KnowledgeCategory, snapshot: {
  layoutTemplate: string;
  fontFamily: string;
  primaryColor: string;
  backgroundType: string;
}): void {
  const dims: Array<[string, string]> = [
    ["layout", snapshot.layoutTemplate],
    ["font", snapshot.fontFamily],
    ["color", snapshot.primaryColor],
    ["background", snapshot.backgroundType],
  ];

  for (const [dim, value] of dims) {
    const key = usageKey(category, dim, value);
    const prev = recentUsage.get(key) ?? [];
    recentUsage.set(key, [...prev, new Date().toISOString()].slice(-DIVERSITY_WINDOW));
  }
}

function overusePenalty(category: KnowledgeCategory, dimension: string, value: string): number {
  const key = usageKey(category, dimension, value);
  const count = (recentUsage.get(key) ?? []).length;
  if (count < DIVERSITY_OVERUSE_THRESHOLD) return 0;
  return (count - DIVERSITY_OVERUSE_THRESHOLD + 1) * 0.08;
}

export function applyDiversityPenalties(
  category: KnowledgeCategory,
  patterns: DesignPattern[],
): DesignPattern[] {
  return patterns
    .map((pattern) => {
      let penalty = 0;
      penalty += overusePenalty(category, "layout", pattern.layoutTemplate);
      penalty += overusePenalty(category, "font", pattern.fontFamily);
      penalty += overusePenalty(category, "color", pattern.primaryColor);
      penalty += overusePenalty(category, "background", pattern.backgroundType);

      const adjustedWeight = Math.max(0.1, pattern.successWeight - penalty);
      return { ...pattern, successWeight: adjustedWeight };
    })
    .sort((a, b) => b.successWeight - a.successWeight);
}

export function getLayoutDiversityBoost(
  category: KnowledgeCategory,
  layoutTemplate: string,
): number {
  const penalty = overusePenalty(category, "layout", layoutTemplate);
  return -penalty * 30;
}
