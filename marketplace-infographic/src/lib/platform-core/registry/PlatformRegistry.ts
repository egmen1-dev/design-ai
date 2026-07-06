import type { IPlatform } from "../interfaces/IPlatform";
import { BaseRegistry } from "./BaseRegistry";

export class PlatformRegistry extends BaseRegistry<IPlatform> {
  resolvePlatform(id: string): IPlatform {
    const platform = this.resolve(id);
    if (!platform) {
      throw new Error(`Platform not registered: ${id}`);
    }
    return platform;
  }
}
