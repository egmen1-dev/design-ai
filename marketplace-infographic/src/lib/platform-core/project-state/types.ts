/** Decision trace entry — replayable platform decision. */
export interface DecisionTraceEntry {
  readonly id: string;
  readonly platformId: string;
  readonly decision: string;
  readonly confidence?: number;
  readonly timestamp: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ProjectStateData {
  readonly project: Readonly<Record<string, unknown>>;
  readonly runtime: Readonly<Record<string, unknown>>;
  readonly contracts: Readonly<Record<string, unknown>>;
  readonly assets: Readonly<Record<string, unknown>>;
  readonly events: readonly Readonly<Record<string, unknown>>[];
  readonly metrics: Readonly<Record<string, unknown>>;
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly execution: Readonly<Record<string, unknown>>;
  readonly architecture: Readonly<Record<string, unknown>>;
  readonly decisionTrace: readonly DecisionTraceEntry[];
}

export const EMPTY_PROJECT_STATE_DATA: ProjectStateData = Object.freeze({
  project: Object.freeze({}),
  runtime: Object.freeze({}),
  contracts: Object.freeze({}),
  assets: Object.freeze({}),
  events: Object.freeze([]),
  metrics: Object.freeze({}),
  configuration: Object.freeze({}),
  execution: Object.freeze({}),
  architecture: Object.freeze({}),
  decisionTrace: Object.freeze([]),
});

export function createProjectStateData(
  patch: Partial<ProjectStateData> = {},
): ProjectStateData {
  return Object.freeze({
    ...EMPTY_PROJECT_STATE_DATA,
    ...patch,
    project: Object.freeze({ ...EMPTY_PROJECT_STATE_DATA.project, ...patch.project }),
    runtime: Object.freeze({ ...EMPTY_PROJECT_STATE_DATA.runtime, ...patch.runtime }),
    contracts: Object.freeze({ ...EMPTY_PROJECT_STATE_DATA.contracts, ...patch.contracts }),
    assets: Object.freeze({ ...EMPTY_PROJECT_STATE_DATA.assets, ...patch.assets }),
    events: Object.freeze(patch.events ?? []),
    metrics: Object.freeze({ ...EMPTY_PROJECT_STATE_DATA.metrics, ...patch.metrics }),
    configuration: Object.freeze({
      ...EMPTY_PROJECT_STATE_DATA.configuration,
      ...patch.configuration,
    }),
    execution: Object.freeze({ ...EMPTY_PROJECT_STATE_DATA.execution, ...patch.execution }),
    architecture: Object.freeze({
      ...EMPTY_PROJECT_STATE_DATA.architecture,
      ...patch.architecture,
    }),
    decisionTrace: Object.freeze(patch.decisionTrace ?? []),
  });
}
