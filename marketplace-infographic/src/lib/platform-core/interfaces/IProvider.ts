/** External image/provider integration contract. */
export interface IProvider {
  readonly id: string;
  readonly version: string;
  readonly capabilities: readonly string[];
}
