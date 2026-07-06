import { LAYER_PATH_RULES, PLATFORM_DIRS } from "./rules";
import type { ArchitectureLayer, FileMigrationPlan } from "./types";

export function classifyFile(relativePath: string, content: string): {
  layer: ArchitectureLayer;
  responsibilities: string[];
} {
  const normalized = relativePath.replace(/\\/g, "/");
  const responsibilities: string[] = [];

  for (const rule of LAYER_PATH_RULES) {
    if (rule.pattern.test(normalized)) {
      return { layer: rule.layer as ArchitectureLayer, responsibilities: inferResponsibilities(normalized, content) };
    }
  }

  if (normalized.startsWith("src/lib/")) {
    const segment = normalized.split("/")[2] ?? "";
    if (PLATFORM_DIRS.some((p) => segment === p || normalized.includes(`/${p}/`))) {
      responsibilities.push("platform-business-logic");
      return { layer: "platforms", responsibilities: inferResponsibilities(normalized, content) };
    }
    if (/handler|pipeline|orchestrat/i.test(normalized)) {
      responsibilities.push("orchestration");
    }
    return { layer: "legacy", responsibilities: inferResponsibilities(normalized, content) };
  }

  if (normalized.startsWith("scripts/")) {
    return { layer: "infrastructure", responsibilities: ["tooling"] };
  }

  if (normalized.startsWith("prisma/")) {
    return { layer: "infrastructure", responsibilities: ["database-schema"] };
  }

  return { layer: "unknown", responsibilities };
}

function inferResponsibilities(path: string, content: string): string[] {
  const responsibilities: string[] = [];
  if (/prompt|Prompt/.test(content) || path.includes("/prompt/")) responsibilities.push("prompt");
  if (/render|Render/.test(path)) responsibilities.push("rendering");
  if (/governance|Governance/.test(path)) responsibilities.push("governance");
  if (/creative|Creative|design-process/.test(path)) responsibilities.push("creative");
  if (/commercial|Commercial/.test(path)) responsibilities.push("commercial");
  if (/knowledge|Knowledge|design\//.test(path)) responsibilities.push("knowledge");
  if (/spec\.ts$/.test(path)) responsibilities.push("tests");
  return responsibilities;
}

export function buildMigrationPlan(
  relativePath: string,
  layer: ArchitectureLayer,
  responsibilities: string[],
): FileMigrationPlan {
  const normalized = relativePath.replace(/\\/g, "/");
  const plan: FileMigrationPlan = {
    keep: [],
    move: [],
    delete: [],
    targetLayer: layer === "unknown" ? "legacy" : layer,
    requiredChanges: [],
    tests: ["architecture"],
    acceptance: ["no new violations"],
  };

  if (normalized.includes("design-process/")) {
    plan.directive = "DSP-001";
    plan.move.push("Scene Planner → Visual Platform", "Prompt Builder → Provider Adapter");
    plan.requiredChanges.push("Replace DesignBrief with CreativeSpec");
    plan.tests.push("unit", "integration");
  } else if (normalized.includes("design-governance/")) {
    plan.directive = "GOV-002";
    plan.move.push("Professional Score → Vision Platform");
    plan.requiredChanges.push("Add ProjectState validation");
  } else if (normalized.includes("render-engine/") || normalized.includes("render-blueprint/")) {
    plan.directive = "REN-002";
    plan.move.push("Prompt → Provider Adapter");
    plan.requiredChanges.push("Execute RenderBlueprint only");
  } else if (normalized.includes("prompt/")) {
    plan.directive = "DSP-003";
    plan.move.push("Entire module → Provider Adapter");
    plan.delete.push("After migration complete");
  } else if (normalized.includes("platform-core/")) {
    plan.directive = "PC-001";
    plan.keep.push("Foundation module");
    plan.acceptance.push("ProjectState immutable");
  } else if (normalized.includes("generate-infographic-handler")) {
    plan.directive = "PC-005";
    plan.requiredChanges.push("Delegate to Runtime; use ProjectState");
    plan.tests.push("integration", "marketplace");
  }

  if (responsibilities.includes("prompt") && !normalized.includes("providers/")) {
    plan.requiredChanges.push("Remove prompt generation (LAW-040)");
  }

  if (layer === "unknown") {
    plan.requiredChanges.push("Classify into canonical layer (Part 27)");
  }

  return plan;
}
