import type { IProvider } from "../interfaces/IProvider";
import { BaseRegistry } from "./BaseRegistry";

export class ProviderRegistry extends BaseRegistry<IProvider> {
  resolveProvider(id: string): IProvider {
    const provider = this.resolve(id);
    if (!provider) {
      throw new Error(`Provider not registered: ${id}`);
    }
    return provider;
  }
}
