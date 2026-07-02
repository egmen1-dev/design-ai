/**
 * Design AI Book — chapters 1–11 registry (audit index)
 */
import type { BookChapterDefinition } from "./types";

export const DESIGN_AI_BOOK_VERSION = "1.0.0";

export const BOOK_CHAPTERS: readonly BookChapterDefinition[] = [
  { chapter: 1, id: "design-philosophy", title: "Design Philosophy", expectedSections: 1, modulePath: "docs/DESIGN-AI-v18-PHILOSOPHY.md", branchSuffix: "philosophy" },
  { chapter: 2, id: "blueprint", title: "Blueprint", expectedSections: 1, modulePath: "src/lib/render-blueprint/types.ts", branchSuffix: "blueprint" },
  { chapter: 3, id: "render-blueprint", title: "Render Blueprint", expectedSections: 19, modulePath: "src/lib/render-blueprint/", branchSuffix: "ch3" },
  { chapter: 4, id: "agent-ecosystem", title: "Agent Ecosystem", expectedSections: 28, modulePath: "src/lib/render-blueprint/", branchSuffix: "ch4" },
  { chapter: 5, id: "design-knowledge-engine", title: "Design Knowledge Engine", expectedSections: 20, modulePath: "src/lib/render-blueprint/", branchSuffix: "ch5" },
  { chapter: 6, id: "design-pipeline", title: "Design Pipeline", expectedSections: 20, modulePath: "src/lib/render-blueprint/", branchSuffix: "ch6" },
  { chapter: 7, id: "platform-architecture", title: "Platform Architecture", expectedSections: 28, modulePath: "src/lib/render-blueprint/", branchSuffix: "ch7" },
  { chapter: 8, id: "design-knowledge-platform", title: "Design Knowledge Platform", expectedSections: 27, modulePath: "src/lib/design-knowledge-platform/", branchSuffix: "ch8" },
  { chapter: 9, id: "intelligent-orchestration-platform", title: "Intelligent Orchestration Platform", expectedSections: 19, modulePath: "src/lib/intelligent-orchestration-platform/", branchSuffix: "ch9" },
  { chapter: 10, id: "human-ai-collaboration", title: "Human AI Collaboration", expectedSections: 15, modulePath: "src/lib/human-ai-collaboration/", branchSuffix: "ch10" },
  { chapter: 11, id: "commercial-intelligence-platform", title: "Commercial Intelligence Platform", expectedSections: 20, modulePath: "src/lib/commercial-intelligence-platform/", branchSuffix: "ch11" },
] as const;

export function getBookChapter(chapter: number): BookChapterDefinition {
  const ch = BOOK_CHAPTERS.find((c) => c.chapter === chapter);
  if (!ch) throw new Error(`Unknown book chapter: ${chapter}`);
  return ch;
}
