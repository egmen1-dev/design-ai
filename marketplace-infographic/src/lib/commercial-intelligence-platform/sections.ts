/**
 * Chapter 11 — Commercial Intelligence Platform (20 sections)
 */
import type { PlatformSectionDefinition } from "../design-ai-book/types";
import { ECOSYSTEM_ENGINES } from "./ecosystem-engines";

export const COMMERCIAL_INTELLIGENCE_SECTIONS: readonly PlatformSectionDefinition[] = [
  ...ECOSYSTEM_ENGINES.map((e) => ({
    ref: e.chapterRef,
    id: e.id,
    label: e.label,
    responsibility: e.responsibility,
    implementationStatus: "full" as const,
  })),
  {
    ref: "11.19",
    id: "platform-summary",
    label: "Commercial Intelligence Platform Summary",
    responsibility: "Capstone synthesis of ecosystem outputs",
    implementationStatus: "full",
  },
  {
    ref: "11.20",
    id: "commercial-intelligence-manifest",
    label: "Commercial Intelligence Manifest",
    responsibility: "Final manifest and creative handoff",
    implementationStatus: "full",
  },
];

export function assertCommercialIntelligenceSectionCount(): number {
  if (COMMERCIAL_INTELLIGENCE_SECTIONS.length !== 20) {
    throw new Error(`Expected 20 sections, got ${COMMERCIAL_INTELLIGENCE_SECTIONS.length}`);
  }
  return 20;
}
