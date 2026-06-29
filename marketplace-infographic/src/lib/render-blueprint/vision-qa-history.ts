/**
 * Chapter 3.18 — Vision report history (regression, design memory, benchmarks)
 */
import { randomUUID } from "crypto";
import type { VisionHistoryEntry, VisionReport } from "./vision-qa-types";
import { hashVisionImage } from "./vision-qa-signals";

export class VisionHistoryStore {
  private readonly entries: VisionHistoryEntry[] = [];

  record(image: string, report: VisionReport): VisionHistoryEntry {
    const entry: VisionHistoryEntry = {
      id: randomUUID(),
      report,
      imageHash: hashVisionImage(image),
      timestamp: Date.now(),
    };
    this.entries.push(entry);
    return entry;
  }

  list(): readonly VisionHistoryEntry[] {
    return this.entries;
  }

  latest(): VisionHistoryEntry | undefined {
    return this.entries.at(-1);
  }

  findByImageHash(hash: string): VisionHistoryEntry[] {
    return this.entries.filter((e) => e.imageHash === hash);
  }

  averageScore(): number {
    if (!this.entries.length) return 0;
    return this.entries.reduce((s, e) => s + e.report.score, 0) / this.entries.length;
  }
}
