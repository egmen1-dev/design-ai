import type { DAOSRenderEngineContextSummary } from "./render-engine-context-adapter";
import type {
  CompiledRenderPayload,
  RenderLayoutBlock,
  RenderRequest,
} from "@/lib/render-engine/types";
import type { VisualSceneBlueprint } from "@/lib/design/visual-pipeline/types";

export const DAOS_V17_MODULES_BRIDGE_MAX_LENGTH = 700;

export const DAOS_V17_COMPILER_MODULES = [
  "layout_coordinates",
  "hierarchy",
  "typography_zones",
  "ctr_wording",
] as const;

export type DaosV17CompilerModule = (typeof DAOS_V17_COMPILER_MODULES)[number];

export type DaosV17ModulesBridgeDiagnostics = {
  applied: boolean;
  length: number;
  preview: string;
  modulesCompiled: string[];
  modulesStillIgnored: string[];
};

const BRIDGE_HEADER = "DAOS V17 MODULES:";

function cleanLine(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim().replace(/\s+/g, " ");
}

function roundCoord(value: number): number {
  return Math.round(value * 100);
}

function compileLayoutCoordinatesSection(
  layout: RenderLayoutBlock,
  visualBlueprint?: VisualSceneBlueprint,
): string | undefined {
  const parts: string[] = [];

  const heroPosition = cleanLine(layout.heroPosition) ?? cleanLine(visualBlueprint?.composition.heroPosition);
  if (heroPosition) parts.push(`hero ${heroPosition}`);

  const negativeSpace = cleanLine(visualBlueprint?.composition.negativeSpace);
  if (negativeSpace) parts.push(`negative space ${negativeSpace}`);

  if (layout.productPlacementPct) {
    parts.push(
      `product zone center ${layout.productPlacementPct.cx} ${layout.productPlacementPct.cy}`,
    );
  }

  if (layout.heroZone) {
    const { x, y, width, height } = layout.heroZone;
    parts.push(`hero zone x${roundCoord(x)} y${roundCoord(y)} w${roundCoord(width)} h${roundCoord(height)}`);
  }

  const safeZones = visualBlueprint?.composition.safeZones?.slice(0, 2) ?? [];
  for (const zone of safeZones) {
    parts.push(
      `${zone.purpose} safe x${Math.round(zone.left)} y${Math.round(zone.top)} w${Math.round(zone.width)} h${Math.round(zone.height)}`,
    );
  }

  if (!parts.length && layout.textSafeZones.length) {
    const productZone = layout.textSafeZones.find((zone) => zone.purpose === "product");
    if (productZone) {
      parts.push(
        `product safe left ${productZone.left} top ${productZone.top} w ${productZone.width} h ${productZone.height}`,
      );
    }
  }

  return parts.length ? `[layout_coordinates] ${parts.join(", ")}` : undefined;
}

function compileHierarchySection(
  daosContext?: DAOSRenderEngineContextSummary,
): string | undefined {
  if (!daosContext) return undefined;

  const parts: string[] = [];
  const mainMessage = cleanLine(daosContext.mainMessage);
  const commercialGoal = cleanLine(daosContext.commercialGoal);
  const creativeConcept = cleanLine(daosContext.creativeConcept);

  if (mainMessage) parts.push(`main ${mainMessage}`);
  if (commercialGoal && commercialGoal !== mainMessage) {
    parts.push(`goal ${commercialGoal}`);
  }
  if (creativeConcept && creativeConcept !== mainMessage && creativeConcept !== commercialGoal) {
    parts.push(`concept ${creativeConcept}`);
  }

  return parts.length ? `[hierarchy] ${parts.join("; ")}` : undefined;
}

function compileTypographyZonesSection(
  layout: RenderLayoutBlock,
  visualBlueprint?: VisualSceneBlueprint,
): string | undefined {
  const parts: string[] = [];

  if (layout.headlineZone) {
    const { x, y, width, height } = layout.headlineZone;
    parts.push(
      `headline zone x${roundCoord(x)} y${roundCoord(y)} w${roundCoord(width)} h${roundCoord(height)} empty`,
    );
  }

  const headlineZones = layout.textSafeZones.filter((zone) => zone.purpose === "headline");
  for (const zone of headlineZones.slice(0, 2)) {
    parts.push(
      `headline safe left ${zone.left} top ${zone.top} w ${zone.width} h ${zone.height} empty`,
    );
  }

  const blueprintHeadlineZones =
    visualBlueprint?.composition.safeZones?.filter((zone) => zone.purpose === "headline") ?? [];
  for (const zone of blueprintHeadlineZones.slice(0, 1)) {
    parts.push(
      `headline safe x${Math.round(zone.left)} y${Math.round(zone.top)} w${Math.round(zone.width)} h${Math.round(zone.height)} empty`,
    );
  }

  return parts.length ? `[typography_zones] ${parts.join(", ")}` : undefined;
}

function compileCtrWordingSection(
  daosContext?: DAOSRenderEngineContextSummary,
  providerHints?: RenderRequest["providerHints"],
): string | undefined {
  const parts: string[] = [];
  const commercialGoal = cleanLine(daosContext?.commercialGoal);
  const mainMessage = cleanLine(daosContext?.mainMessage);

  if (commercialGoal) parts.push(`hook ${commercialGoal}`);
  if (mainMessage && mainMessage !== commercialGoal) {
    parts.push(`message ${mainMessage}`);
  }

  const marketSnippet =
    typeof providerHints?.marketSnippet === "string"
      ? cleanLine(providerHints.marketSnippet)
      : undefined;
  if (marketSnippet) parts.push(`market ${marketSnippet.slice(0, 80)}`);

  const ctrHook =
    typeof providerHints?.ctrHook === "string" ? cleanLine(providerHints.ctrHook) : undefined;
  if (ctrHook) parts.push(`ctr ${ctrHook}`);

  return parts.length ? `[ctr_wording] ${parts.join("; ")}` : undefined;
}

export function isDaosV17ModulesBridgeEnabled(): boolean {
  return process.env.DAOS_V17_MODULES_BRIDGE === "1";
}

export function createDaosV17ModulesBridgeBlock(request: RenderRequest): {
  block: string;
  modulesCompiled: DaosV17CompilerModule[];
} {
  const layout = request.layout;
  const daosContext = request.metadata?.daosContext;
  const visualBlueprint = request.metadata?.visualBlueprint;

  const sections: { module: DaosV17CompilerModule; text: string }[] = [];

  const layoutSection = compileLayoutCoordinatesSection(layout, visualBlueprint);
  if (layoutSection) sections.push({ module: "layout_coordinates", text: layoutSection });

  const hierarchySection = compileHierarchySection(daosContext);
  if (hierarchySection) sections.push({ module: "hierarchy", text: hierarchySection });

  const typographySection = compileTypographyZonesSection(layout, visualBlueprint);
  if (typographySection) sections.push({ module: "typography_zones", text: typographySection });

  const ctrSection = compileCtrWordingSection(daosContext, request.providerHints);
  if (ctrSection) sections.push({ module: "ctr_wording", text: ctrSection });

  if (!sections.length) {
    return { block: "", modulesCompiled: [] };
  }

  const lines = [BRIDGE_HEADER];
  const modulesCompiled: DaosV17CompilerModule[] = [];
  let length = BRIDGE_HEADER.length;

  for (const section of sections) {
    const nextLine = section.text;
    const extra = lines.length > 1 ? 1 + nextLine.length : 1 + nextLine.length;
    if (length + extra > DAOS_V17_MODULES_BRIDGE_MAX_LENGTH) break;
    lines.push(nextLine);
    modulesCompiled.push(section.module);
    length += extra;
  }

  if (!modulesCompiled.length) {
    return { block: "", modulesCompiled: [] };
  }

  return { block: lines.join("\n"), modulesCompiled };
}

/** Clone compiled payload and append DAOS v17 module sections when flag is on. */
export function attachDaosV17ModulesBridgeToPayload(
  payload: CompiledRenderPayload,
  request: RenderRequest,
): CompiledRenderPayload {
  try {
    if (!isDaosV17ModulesBridgeEnabled()) {
      return payload;
    }

    const { block, modulesCompiled } = createDaosV17ModulesBridgeBlock(request);
    if (!block || !modulesCompiled.length) {
      return payload;
    }

    const ignored = new Set(payload.modulesIgnored ?? []);
    const modulesStillIgnored = [...ignored].filter((module) => !modulesCompiled.includes(module as DaosV17CompilerModule));

    return {
      ...payload,
      prompt: `${payload.prompt}\n\n${block}`,
      daosV17Modules: {
        applied: true,
        length: block.length,
        preview: block.slice(0, 240),
        modulesCompiled: [...modulesCompiled],
        modulesStillIgnored,
      },
    };
  } catch {
    return payload;
  }
}

export function extractDaosV17ModulesDiagnostics(
  payload: CompiledRenderPayload | undefined,
): DaosV17ModulesBridgeDiagnostics | undefined {
  return payload?.daosV17Modules;
}
