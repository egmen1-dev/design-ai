import type { DAOSProjectState } from "../core/project-state";

export type DAOSRuntimeResult<T> = {
  ok: boolean;
  state: DAOSProjectState;
  output?: T;
  error?: string;
};

export interface DAOSRuntimeNode<TInput, TOutput> {
  id: string;
  name: string;
  run(input: TInput, state: DAOSProjectState): Promise<DAOSRuntimeResult<TOutput>>;
}

export class DAOSRuntime {
  private nodes = new Map<string, DAOSRuntimeNode<unknown, unknown>>();

  register(node: DAOSRuntimeNode<unknown, unknown>) {
    this.nodes.set(node.id, node);
  }

  getNode(id: string) {
    return this.nodes.get(id);
  }

  listNodes() {
    return Array.from(this.nodes.values()).map((node) => ({
      id: node.id,
      name: node.name,
    }));
  }
}
