import type { CompiledSection, PromptCompilerInput, PromptSectionId } from "./types";
import { DESIGN_CONSTITUTION_RULES } from "@/lib/design/design-constitution";
import { getProfile } from "./profiles";
import type { RenderingProfileId } from "./types";
import { MATERIAL_PROFILES } from "@/lib/design/scene-blueprint/materials";
import { hierarchyPromptBlock } from "@/lib/design/composition-director";

function section(
  id: PromptSectionId,
  module: string,
  content: string,
  reason: string,
  rules: string[] = [],
): CompiledSection {
  return { id, module, content, reason, rulesApplied: rules };
}

export function compileProductIdentity(input: PromptCompilerInput): CompiledSection {
  const category = input.analysis.category.replace(/_/g, " ");
  const colors = input.productColors?.slice(0, 2).join(" and ") ?? "neutral product tones";
  return section(
    "product_identity",
    "product-analyzer",
    `commercial ${category} product hero, shape ${input.productShape ?? "standard"}, complementing colors ${colors}, single primary object only, no duplicate products`,
    "Defines the one hero object SD must leave empty for compositing",
    ["1 hero object", "max 3 secondary elements"],
  );
}

export function compileSceneSection(
  input: PromptCompilerInput,
  profileId: RenderingProfileId,
): CompiledSection {
  const bp = input.sceneBlueprint;
  const content = bp
    ? `scene type ${bp.scene.type.replace(/_/g, " ")}, atmosphere ${bp.scene.atmosphere}, depth ${bp.scene.depth}`
    : `scene mood ${input.scenePlan.visualMood}, concept ${input.scenePlan.coverConceptId.replace(/_/g, " ")}`;
  return section(
    "scene",
    "scene-blueprint",
    content,
    "Structured scene from Scene Director blueprint",
    ["no random particles", "no visual clutter"],
  );
}

export function compileEnvironmentSection(input: PromptCompilerInput): CompiledSection {
  const bp = input.sceneBlueprint;
  const env = bp
    ? `environment ${bp.scene.environment}, floor ${bp.scene.floor}, background ${bp.scene.background}`
    : `environment ${input.scenePlan.backgroundType}, surface ${input.scenePlan.surfaceType}, horizon ${input.scenePlan.horizon}`;
  return section(
    "environment",
    "scene-blueprint",
    env,
    "Environment from blueprint, not invented prose",
    ["minimal decorative objects"],
  );
}

export function compileCompositionSection(input: PromptCompilerInput): CompiledSection {
  const spec = input.layoutSpec;
  const geo = spec?.geometry;
  const ws = spec?.whitespaceTarget ?? 28;
  const content = geo
    ? `composition template ${spec?.compositionTemplateId ?? "hero_right"}, hero zone x=${geo.hero.x.toFixed(2)} y=${geo.hero.y.toFixed(2)} w=${geo.hero.width.toFixed(2)} h=${geo.hero.height.toFixed(2)}, whitespace target ${ws}%, eye flow hero then headline then benefits then cta`
    : `composition hero ${spec?.heroPosition ?? "right"}, whitespace ${ws}%, max ${spec?.maxSecondaryObjects ?? 2} secondary elements`;
  return section(
    "composition",
    "composition-director",
    content,
    "Deterministic geometry from Composition Director LayoutSpec",
    ["whitespace 20-35%", "no floating products"],
  );
}

export function compileLightingSection(
  input: PromptCompilerInput,
  profileId: RenderingProfileId,
): CompiledSection {
  const profile = getProfile(profileId);
  const bp = input.sceneBlueprint?.lighting;
  const content = bp
    ? `lighting preset ${bp.preset}, key ${bp.key}, fill ${bp.fill}, rim ${bp.rim}, back ${bp.back}, ${bp.temperatureK}K`
    : `${profile.lighting}, direction ${input.scenePlan.lightingDirection}, temperature ${input.scenePlan.lightingTemperature}, shadow ${input.scenePlan.shadowProfile}`;
  return section(
    "lighting",
    "lighting-presets",
    content,
    "Structured lighting from blueprint or rendering profile",
    ["no flat lighting"],
  );
}

export function compileMaterialsSection(input: PromptCompilerInput): CompiledSection {
  const material = input.sceneBlueprint?.scene.material;
  const m = material ? MATERIAL_PROFILES[material] : null;
  const content = m
    ? `material ${m.label}, ${m.floor}, reflection ${m.reflection}, ${m.atmosphere}`
    : `surface ${input.scenePlan.surfaceType}, physical accuracy, contact shadow area on surface`;
  return section(
    "materials",
    "material-language",
    content,
    "Material language drives reflections and surface behavior",
    ["no unnecessary gradients"],
  );
}

export function compileCameraSection(
  input: PromptCompilerInput,
  profileId: RenderingProfileId,
): CompiledSection {
  const profile = getProfile(profileId);
  const cam = input.sceneBlueprint?.camera;
  const content = cam
    ? `${cam.lensMm}mm lens, ${cam.height}, ${cam.distance}, ${cam.angle}, depth of field ${input.scenePlan.depthOfField}`
    : `${profile.camera}, ${input.scenePlan.cameraAngle}, ${input.scenePlan.cameraHeight}, ${input.scenePlan.cameraDistance}`;
  return section(
    "camera",
    "rendering-profile",
    content,
    "Camera from profile + scene plan, never random",
    [],
  );
}

export function compileBackgroundSection(input: PromptCompilerInput): CompiledSection {
  const zones = input.scenePlan.textSafeZones
    .map((z) => `${z.purpose} zone ${z.left}% ${z.top}% ${z.width}x${z.height}% empty`)
    .join("; ");
  const pz = input.scenePlan.productSafeZone;
  const cx = Math.round((pz.centerX[0] + pz.centerX[1]) / 2);
  const cy = Math.round((pz.centerY[0] + pz.centerY[1]) / 2);
  return section(
    "background",
    "scene-planner",
    `background for compositing, product placement zone ${cx}% ${cy}% empty, text safe zones: ${zones}, no objects in product zone, atmospheric depth foreground midground background`,
    "Reserves zones for product and typography overlay",
    ["no text in background", "no product in scene"],
  );
}

export function compileVisualHierarchySection(input: PromptCompilerInput): CompiledSection {
  const hierarchy = input.layoutSpec?.hierarchy;
  const content = hierarchy
    ? hierarchyPromptBlock(hierarchy).replace(/\n/g, ", ")
    : "visual hierarchy: hero dominant, headline H1, one benefit, optional CTA badge, decorative minimal";
  return section(
    "visual_hierarchy",
    "composition-director",
    content,
    "Preserves designed reading and attention order",
    DESIGN_CONSTITUTION_RULES.slice(0, 4),
  );
}

export function compileTypographySafeZone(input: PromptCompilerInput): CompiledSection {
  const headline = input.layoutSpec?.geometry?.headline;
  const zones = input.scenePlan.textSafeZones.filter((z) => z.purpose === "headline");
  const content = headline
    ? `typography safe zone headline x=${headline.x.toFixed(2)} y=${headline.y.toFixed(2)} w=${headline.width.toFixed(2)}, keep clear for overlay, max 2 lines, high contrast`
    : zones.length
      ? `headline safe zone ${zones[0].left}% ${zones[0].top}% keep empty for text overlay`
      : "upper left text safe zone reserved, no background patterns in headline area";
  return section(
    "typography_safe_zone",
    "layout-spec",
    content,
    "Protects headline readability in final composite",
    ["no text artifacts in background"],
  );
}

export function compileRenderingQuality(profileId: RenderingProfileId): CompiledSection {
  const profile = getProfile(profileId);
  return section(
    "rendering_quality",
    "rendering-profile",
    `${profile.colorDiscipline}, 8k photorealistic commercial advertising photography, physical light accuracy, no AI artifacts`,
    "Quality bar from rendering profile",
    ["max 4 colors"],
  );
}

export function compileMarketplaceConstraints(input: PromptCompilerInput): CompiledSection {
  const palette = input.layoutSpec?.palette?.slice(0, 4).join(", ") ?? "brand palette";
  return section(
    "marketplace_constraints",
    "market-intelligence",
    `Wildberries marketplace cover 900x1200, ${palette}, trustworthy commercial look, designed whitespace not empty accident, ${input.marketSnippet ? `market: ${input.marketSnippet.slice(0, 80)}` : "marketplace CTR optimized"}`,
    "Marketplace-specific rendering constraints",
    ["marketplace compatibility"],
  );
}

export function compileAllSections(
  input: PromptCompilerInput,
  profileId: RenderingProfileId,
): CompiledSection[] {
  return [
    compileProductIdentity(input),
    compileSceneSection(input, profileId),
    compileEnvironmentSection(input),
    compileCompositionSection(input),
    compileLightingSection(input, profileId),
    compileMaterialsSection(input),
    compileCameraSection(input, profileId),
    compileBackgroundSection(input),
    compileVisualHierarchySection(input),
    compileTypographySafeZone(input),
    compileRenderingQuality(profileId),
    compileMarketplaceConstraints(input),
  ];
}

export function joinSections(sections: CompiledSection[]): string {
  return sections.map((s) => s.content).join(", ");
}
