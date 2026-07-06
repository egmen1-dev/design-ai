import type { IProjectState } from "@/lib/platform-core/interfaces/IProjectState";

export type LegacyOverlayExecutor = (
  input: Readonly<Record<string, unknown>>,
) => Promise<Readonly<Record<string, unknown>>>;

/** Pass-through adapter — overlay/templates untouched in Wave 1. */
export class LegacyOverlayAdapter {
  constructor(private readonly executor?: LegacyOverlayExecutor) {}

  async overlay(state: IProjectState): Promise<IProjectState> {
    if (!this.executor) {
      return state;
    }
    const result = await this.executor({
      projectId: state.context.projectId,
      assets: state.data.assets,
    });
    return state.withData({
      assets: Object.freeze({ ...state.data.assets, legacyOverlay: result }),
    });
  }
}
