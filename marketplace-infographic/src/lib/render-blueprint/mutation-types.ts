/**
 * Chapter 3.5 — Mutation Engine types
 */
import type { BlueprintSection } from "./types";

export type BlueprintMutation<T = unknown> = {
  section: BlueprintSection;
  producer: string;
  expectedRevision: number;
  payload: T;
  reason: string;
  timestamp: number;
};

export type MutationBatch = {
  mutations: BlueprintMutation[];
};

export type MutationAppliedEvent = {
  section: BlueprintSection;
  revision: number;
  producer: string;
  duration: number;
};

export type MutationAuditEntry = {
  revision: number;
  producer: string;
  section: BlueprintSection;
  timestamp: number;
  previousValueHash: string;
  newValueHash: string;
  durationMs: number;
  reason: string;
};

export type MutationApplyResult = {
  blueprint: import("./types").RenderBlueprint;
  applied: boolean;
  skipped: boolean;
  revision: number;
  invalidatedSections: BlueprintSection[];
  event?: MutationAppliedEvent;
  audit?: MutationAuditEntry;
};

export type MutationBatchResult = {
  blueprint: import("./types").RenderBlueprint;
  results: MutationApplyResult[];
  appliedCount: number;
  skippedCount: number;
};

export type MutationValidationError = {
  code:
    | "SCHEMA"
    | "LIFECYCLE"
    | "REVISION"
    | "OWNERSHIP"
    | "LOCK"
    | "DEPENDENCY"
    | "CONFLICT"
    | "SECTION_NOT_FOUND";
  message: string;
  section?: BlueprintSection;
};
