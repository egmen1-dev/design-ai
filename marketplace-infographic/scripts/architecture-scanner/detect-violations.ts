import { importTargetsLayer } from "./analyze-imports";
import { PLATFORM_DIRS } from "./rules";
import type { ArchitectureLayer, FileMetadata, ViolationType } from "./types";

export function detectViolations(
  relativePath: string,
  layer: ArchitectureLayer,
  imports: string[],
  content: string,
): ViolationType[] {
  const violations = new Set<ViolationType>();
  const path = relativePath.replace(/\\/g, "/");

  if (layer === "unknown") violations.add("UNKNOWN_LAYER");

  const isProviderPath = path.includes("/providers/") || path.includes("provider-adapter");
  const promptImport =
    importTargetsLayer(imports, /\/(prompt|design-process\/.*prompt)/) ||
    (/\b(buildPrompt|generatePrompt|promptBuilder)\b/.test(content) && !isProviderPath);
  if (promptImport && !isProviderPath) violations.add("PROMPT_OUTSIDE_PROVIDER");

  if (layer === "runtime" && importTargetsLayer(imports, /\/legacy\//)) {
    violations.add("LEGACY_IMPORT_IN_RUNTIME");
  }

  if (layer === "platforms") {
    const platformHits = PLATFORM_DIRS.filter(
      (p) => importTargetsLayer(imports, new RegExp(`/${p}/`)) && path.includes(p) === false,
    );
    if (platformHits.length >= 2) violations.add("PLATFORM_IMPORTS_PLATFORM");
    if (importTargetsLayer(imports, /\/(openai|flux|provider)/i) && !path.includes("providers")) {
      violations.add("PROVIDER_LOGIC_IN_PLATFORM");
    }
  }

  if (layer === "runtime" && importTargetsLayer(imports, /\/providers\//)) {
    violations.add("RUNTIME_IMPORTS_PROVIDER");
  }

  if (
    (path.includes("/shared/") || path.includes("utils")) &&
    /\b(strategy|commercial|creative|buyer|marketplace)\b/i.test(content)
  ) {
    violations.add("BUSINESS_LOGIC_IN_UTILS");
  }

  if (
    /\b(readFileSync|writeFileSync|createWriteStream|fs\.promises)\b/.test(content) &&
    !path.includes("/assets/") &&
    layer !== "infrastructure"
  ) {
    violations.add("FILESYSTEM_ACCESS_OUTSIDE_ASSET_PLATFORM");
  }

  if (
    (path.includes("infographic-html") || path.includes("templates/")) &&
    /\b(layout|position:\s*absolute|grid-template)\b/i.test(content)
  ) {
    violations.add("HTML_LAYOUT_OWNS_DESIGN");
  }

  if (
    path.includes("design-process/") &&
    /\bDesignBrief\b/.test(content) &&
    !/\bCreativeSpec\b/.test(content)
  ) {
    violations.add("DTO_NOT_REGISTERED");
  }

  if (
    (path.includes("design-process/") || path.includes("commercial")) &&
    !/DecisionTrace|decisionTrace/.test(content) &&
    !path.endsWith(".spec.ts")
  ) {
    violations.add("MISSING_DECISION_TRACE");
  }

  if (
    path.includes("generate-infographic-handler") &&
    !/ProjectState/.test(content)
  ) {
    violations.add("MISSING_PROJECT_STATE");
  }

  if (
    (path.includes("render-engine/") || path.includes("render-blueprint/")) &&
    /\b(commercial|creative|strategy|buyerPsychology)\b/i.test(content)
  ) {
    violations.add("RENDERING_MAKES_BUSINESS_DECISION");
  }

  return [...violations];
}

export function computeRisk(layer: ArchitectureLayer, violations: ViolationType[]): FileMetadata["risk"] {
  if (violations.some((v) => v === "PROMPT_OUTSIDE_PROVIDER" || v === "LEGACY_IMPORT_IN_RUNTIME")) {
    return "critical";
  }
  if (layer === "unknown" || violations.length >= 3) return "high";
  if (violations.length > 0) return "medium";
  return "low";
}
