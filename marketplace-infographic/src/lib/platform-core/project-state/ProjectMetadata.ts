import type { DecisionTraceEntry } from "../project-state/types";

/** Architecture and project metadata stored in ProjectState. */
export interface ProjectMetadata {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly architectureScore?: number;
  readonly tags: readonly string[];
}

export function createProjectMetadata(
  partial: Partial<ProjectMetadata> & Pick<ProjectMetadata, "createdAt" | "updatedAt">,
): ProjectMetadata {
  return Object.freeze({
    tags: [],
    ...partial,
  });
}

export type { DecisionTraceEntry };
