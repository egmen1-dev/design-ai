/** Project execution context — identity and environment metadata. */
export interface ProjectContext {
  readonly projectId: string;
  readonly runId: string;
  readonly marketplace: string;
  readonly product: string;
  readonly generationMode: string;
  readonly architectureVersion: string;
  readonly runtimeVersion: string;
  readonly provider: string;
  readonly userPreferences: Readonly<Record<string, unknown>>;
}

export function createProjectContext(
  input: ProjectContext,
): ProjectContext {
  return Object.freeze(structuredClone(input));
}

export function mergeProjectContext(
  base: ProjectContext,
  patch: Partial<ProjectContext>,
): ProjectContext {
  return createProjectContext({ ...base, ...patch });
}
