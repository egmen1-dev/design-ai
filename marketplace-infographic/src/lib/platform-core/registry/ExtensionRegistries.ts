import type { ISkill } from "../interfaces/ISkill";
import type { IPlugin } from "../interfaces/IPlugin";
import { BaseRegistry } from "./BaseRegistry";

export class SkillRegistry extends BaseRegistry<ISkill> {}
export class PluginRegistry extends BaseRegistry<IPlugin> {}

/** Validator and critic hooks registered by id. */
export class ValidatorRegistry extends BaseRegistry<{ readonly id: string }> {}
export class CriticRegistry extends BaseRegistry<{ readonly id: string }> {}
