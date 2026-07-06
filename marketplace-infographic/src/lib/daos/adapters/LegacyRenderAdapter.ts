import type { IProjectState } from "@/lib/platform-core/interfaces/IProjectState";

export type LegacyRenderExecutor = (
  input: Readonly<Record<string, unknown>>,
) => Promise<Readonly<Record<string, unknown>>>;

/** Pass-through adapter — render-engine untouched in Wave 1. */
export class LegacyRenderAdapter {
  constructor(private readonly executor?: LegacyRenderExecutor) {}

  async render(state: IProjectState): Promise<IProjectState> {
    if (!this.executor) {
      return state;
    }
    const result = await this.executor({
      projectId: state.context.projectId,
      contracts: state.data.contracts,
    });
    return state.withData({
      assets: Object.freeze({ ...state.data.assets, legacyRender: result }),
    });
  }
}
