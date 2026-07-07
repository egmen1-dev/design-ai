import type { IProjectState } from "@/lib/platform-core/interfaces/IProjectState";

/** Optional legacy executor — wired in a later wave; not imported in Wave 1. */
export type LegacyPipelineExecutor = (
  input: Readonly<Record<string, unknown>>,
) => Promise<Readonly<Record<string, unknown>>>;

/**
 * Bridges ProjectState ↔ legacy design pipeline without modifying legacy modules.
 */
export class LegacyDesignPipelineAdapter {
  constructor(private readonly executor?: LegacyPipelineExecutor) {}

  async toLegacyInput(state: IProjectState): Promise<Readonly<Record<string, unknown>>> {
    return Object.freeze({
      projectId: state.context.projectId,
      runId: state.context.runId,
      marketplace: state.context.marketplace,
      product: state.context.product,
      generationMode: state.context.generationMode,
      userInput: state.data.project,
    });
  }

  async fromLegacyOutput(
    state: IProjectState,
    output: Readonly<Record<string, unknown>>,
  ): Promise<IProjectState> {
    return state.withData({
      project: Object.freeze({ ...state.data.project, legacyOutput: output }),
    });
  }

  async run(state: IProjectState): Promise<IProjectState> {
    if (!this.executor) {
      return state;
    }
    const input = await this.toLegacyInput(state);
    const output = await this.executor(input);
    return this.fromLegacyOutput(state, output);
  }
}
