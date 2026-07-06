import type { IProjectState } from "@/lib/platform-core/interfaces/IProjectState";

export type LegacyPromptExecutor = (
  input: Readonly<Record<string, unknown>>,
) => Promise<string>;

/** Pass-through adapter — prompt compiler stays in legacy until Phase D. */
export class LegacyPromptAdapter {
  constructor(private readonly executor?: LegacyPromptExecutor) {}

  async compile(state: IProjectState): Promise<IProjectState> {
    if (!this.executor) {
      return state;
    }
    const prompt = await this.executor({
      projectId: state.context.projectId,
      contracts: state.data.contracts,
    });
    return state.withData({
      runtime: Object.freeze({ ...state.data.runtime, legacyPrompt: prompt }),
    });
  }
}
