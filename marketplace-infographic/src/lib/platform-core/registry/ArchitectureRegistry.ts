import { PlatformRegistry } from "./PlatformRegistry";
import { ProviderRegistry } from "./ProviderRegistry";
import {
  SkillRegistry,
  PluginRegistry,
  ValidatorRegistry,
  CriticRegistry,
} from "./ExtensionRegistries";
import { EventRegistry } from "./EventRegistry";

/**
 * Architecture Registry — runtime resolves implementations without direct imports.
 * Runtime never imports platforms; runtime asks Registry.
 */
export class ArchitectureRegistry {
  readonly platforms = new PlatformRegistry();
  readonly providers = new ProviderRegistry();
  readonly skills = new SkillRegistry();
  readonly plugins = new PluginRegistry();
  readonly validators = new ValidatorRegistry();
  readonly critics = new CriticRegistry();
  readonly events = new EventRegistry();
}
