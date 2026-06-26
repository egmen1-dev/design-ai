/** Базовый контракт дизайн-агента */
export type AgentMeta = {
  id: string;
  name: string;
  version: string;
};

export type DesignAgent<TInput, TOutput> = AgentMeta & {
  run(input: TInput): Promise<TOutput>;
};
