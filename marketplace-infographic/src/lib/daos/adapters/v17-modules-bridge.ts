import type { CommercialSpec } from "../contracts/specs";
import type { DAOSRenderEngineContextSummary } from "./render-engine-context-adapter";
import type {
  CompiledRenderPayload,
  RenderLayoutBlock,
  RenderRequest,
} from "@/lib/render-engine/types";
import type { VisualSceneBlueprint } from "@/lib/design/visual-pipeline/types";
import type { MarketplaceCtrReview } from "@/lib/agents/marketplace-ctr-expert/types";
import type { SeniorArtDirectorReview } from "@/lib/agents/senior-art-director/types";

export const DAOS_V17_MODULES_BRIDGE_MAX_LENGTH = 700;
export const DAOS_V17_CTR_SECTION_MAX_LENGTH = 180;

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

export type DaosV17CtrBridgeDiagnostics = {
  applied: boolean;
  length: number;
  source: string;
  preview: string;
};

const BRIDGE_HEADER = "DAOS V17 MODULES:";

function cleanLine(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim().replace(/\s+/g, " ");
}

function roundCoord(value: number): number {
  return Math.round(value * 100);
}

function firstString(values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const cleaned = cleanLine(value);
    if (cleaned) return cleaned;
  }
  return undefined;
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

function compileCtrWordingSectionBasic(
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

type CtrWordingFields = {
  mainMessage?: string;
  clickTrigger?: string;
  trustDriver?: string;
  sources: string[];
};

function extractCtrWordingFields(request: RenderRequest): CtrWordingFields | null {
  const daosContext = request.metadata?.daosContext;
  const commercialSpec = request.metadata?.commercialSpec as CommercialSpec | undefined;
  const ctrExpert = request.metadata?.ctrExpert as MarketplaceCtrReview | undefined;
  const seniorArtDirector = request.metadata?.seniorArtDirector as SeniorArtDirectorReview | undefined;
  const providerHints = request.providerHints;

  const sources: string[] = [];
  const mainMessage = firstString([
    daosContext?.mainMessage,
    commercialSpec?.mainMessage,
  ]);
  if (mainMessage) {
    sources.push(daosContext?.mainMessage ? "daosContext.mainMessage" : "commercialSpec.mainMessage");
  }

  const clickTrigger = firstString([
    typeof providerHints?.ctrHook === "string" ? providerHints.ctrHook : undefined,
    ctrExpert?.recommendations?.[0],
    ctrExpert?.issues?.[0],
    typeof providerHints?.marketSnippet === "string" ? providerHints.marketSnippet : undefined,
    request.metadata?.marketSnippet,
    daosContext?.commercialGoal,
    commercialSpec?.usp?.[0],
    daosContext?.warnings?.[0],
  ]);
  if (clickTrigger) {
    if (typeof providerHints?.ctrHook === "string" && cleanLine(providerHints.ctrHook) === clickTrigger) {
      sources.push("providerHints.ctrHook");
    } else if (ctrExpert?.recommendations?.[0] === clickTrigger) {
      sources.push("ctrExpert.recommendations");
    } else if (ctrExpert?.issues?.[0] === clickTrigger) {
      sources.push("ctrExpert.issues");
    } else if (
      (typeof providerHints?.marketSnippet === "string" &&
        cleanLine(providerHints.marketSnippet) === clickTrigger) ||
      request.metadata?.marketSnippet === clickTrigger
    ) {
      sources.push("marketSnippet");
    } else if (daosContext?.commercialGoal === clickTrigger) {
      sources.push("daosContext.commercialGoal");
    } else if (commercialSpec?.usp?.[0] === clickTrigger) {
      sources.push("commercialSpec.usp");
    } else if (daosContext?.warnings?.[0] === clickTrigger) {
      sources.push("daosContext.warnings");
    }
  }

  const trustDriver = firstString([
    commercialSpec?.trustDrivers?.[0],
    seniorArtDirector?.recommendations?.[0],
    commercialSpec?.hierarchy?.[1],
    daosContext?.warnings?.find((warning) => warning !== clickTrigger),
  ]);
  if (trustDriver) {
    if (commercialSpec?.trustDrivers?.[0] === trustDriver) {
      sources.push("commercialSpec.trustDrivers");
    } else if (seniorArtDirector?.recommendations?.[0] === trustDriver) {
      sources.push("seniorArtDirector.recommendations");
    } else {
      sources.push("daosContext.warnings");
    }
  }

  if (!mainMessage && !clickTrigger && !trustDriver) {
    return null;
  }

  return { mainMessage, clickTrigger, trustDriver, sources };
}

export function isDaosV17ModulesBridgeEnabled(): boolean {
  return process.env.DAOS_V17_MODULES_BRIDGE === "1";
}

export function isDaosV17CtrBridgeEnabled(): boolean {
  return process.env.DAOS_V17_CTR_BRIDGE === "1";
}

/** Wave 17 CTR section (max 180 chars) from pipeline commercial/market data. */
export function compileCtrWordingSectionEnhanced(
  request: RenderRequest,
): { section: string; source: string; length: number } | undefined {
  const fields = extractCtrWordingFields(request);
  if (!fields) return undefined;

  const lines = ["CTR wording intent:"];
  if (fields.mainMessage) lines.push(`- main message: ${fields.mainMessage}`);
  if (fields.clickTrigger) lines.push(`- click trigger: ${fields.clickTrigger}`);
  if (fields.trustDriver) lines.push(`- trust driver: ${fields.trustDriver}`);

  if (lines.length === 1) return undefined;

  let body = lines.join("\n");
  if (body.length > DAOS_V17_CTR_SECTION_MAX_LENGTH) {
    body = `${body.slice(0, DAOS_V17_CTR_SECTION_MAX_LENGTH - 3)}...`;
  }

  return {
    section: body,
    source: [...new Set(fields.sources)].join("+"),
    length: body.length,
  };
}

export function createDaosV17ModulesBridgeBlock(request: RenderRequest): {
  block: string;
  modulesCompiled: DaosV17CompilerModule[];
  ctrDiagnostics?: DaosV17CtrBridgeDiagnostics;
} {
  const layout = request.layout;
  const daosContext = request.metadata?.daosContext;
  const visualBlueprint = request.metadata?.visualBlueprint;

  const sections: { module: DaosV17CompilerModule; text: string }[] = [];
  let ctrDiagnostics: DaosV17CtrBridgeDiagnostics | undefined;

  const layoutSection = compileLayoutCoordinatesSection(layout, visualBlueprint);
  if (layoutSection) sections.push({ module: "layout_coordinates", text: layoutSection });

  const hierarchySection = compileHierarchySection(daosContext);
  if (hierarchySection) sections.push({ module: "hierarchy", text: hierarchySection });

  const typographySection = compileTypographyZonesSection(layout, visualBlueprint);
  if (typographySection) sections.push({ module: "typography_zones", text: typographySection });

  if (isDaosV17CtrBridgeEnabled()) {
    const ctrEnhanced = compileCtrWordingSectionEnhanced(request);
    if (ctrEnhanced) {
      const ctrText = `[ctr_wording] ${ctrEnhanced.section}`;
      sections.push({ module: "ctr_wording", text: ctrText });
      ctrDiagnostics = {
        applied: true,
        length: ctrEnhanced.length,
        source: ctrEnhanced.source,
        preview: ctrEnhanced.section.slice(0, 120),
      };
    }
  } else {
    const ctrSection = compileCtrWordingSectionBasic(daosContext, request.providerHints);
    if (ctrSection) sections.push({ module: "ctr_wording", text: ctrSection });
  }

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

  if (ctrDiagnostics && !modulesCompiled.includes("ctr_wording")) {
    ctrDiagnostics = undefined;
  }

  return { block: lines.join("\n"), modulesCompiled, ctrDiagnostics };
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

    const { block, modulesCompiled, ctrDiagnostics } = createDaosV17ModulesBridgeBlock(request);
    if (!block || !modulesCompiled.length) {
      return payload;
    }

    const ignored = new Set(payload.modulesIgnored ?? []);
    const modulesStillIgnored = [...ignored].filter(
      (module) => !modulesCompiled.includes(module as DaosV17CompilerModule),
    );

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
      ...(ctrDiagnostics ? { daosV17Ctr: ctrDiagnostics } : {}),
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

export function extractDaosV17CtrDiagnostics(
  payload: CompiledRenderPayload | undefined,
): DaosV17CtrBridgeDiagnostics | undefined {
  return payload?.daosV17Ctr;
}
