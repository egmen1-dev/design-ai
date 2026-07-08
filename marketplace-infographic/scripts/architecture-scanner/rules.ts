import type { ViolationType } from "./types";

export const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "generated",
  ".cache",
  ".git",
]);

export const SCAN_ROOTS = ["src", "scripts", "prisma"] as const;

export const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

export const VIOLATION_LABELS: Record<ViolationType, string> = {
  PROMPT_OUTSIDE_PROVIDER: "Prompt generation or import outside Provider Adapter",
  LEGACY_IMPORT_IN_RUNTIME: "Legacy import inside Runtime layer",
  PLATFORM_IMPORTS_PLATFORM: "Platform imports another platform directly",
  RUNTIME_IMPORTS_PROVIDER: "Runtime imports Provider directly",
  BUSINESS_LOGIC_IN_UTILS: "Business logic in shared/utils path",
  FILESYSTEM_ACCESS_OUTSIDE_ASSET_PLATFORM: "Filesystem access outside Asset Platform",
  HTML_LAYOUT_OWNS_DESIGN: "HTML template owns design layout",
  DTO_NOT_REGISTERED: "DTO type not registered in contracts",
  MISSING_DECISION_TRACE: "Creative/commercial path without DecisionTrace",
  MISSING_PROJECT_STATE: "Orchestration without ProjectState",
  PROVIDER_LOGIC_IN_PLATFORM: "Provider logic inside platform module",
  RENDERING_MAKES_BUSINESS_DECISION: "Render engine makes business decisions",
  UNKNOWN_LAYER: "File layer could not be classified",
};

export const LAYER_PATH_RULES: Array<{ layer: string; pattern: RegExp }> = [
  { layer: "platform-core", pattern: /[/\\]platform-core[/\\]/ },
  { layer: "runtime", pattern: /[/\\]runtime[/\\]/ },
  { layer: "contracts", pattern: /[/\\]contracts[/\\]/ },
  { layer: "providers", pattern: /[/\\]providers[/\\]/ },
  { layer: "sdk", pattern: /[/\\]sdk[/\\]/ },
  { layer: "assets", pattern: /[/\\]assets[/\\]/ },
  { layer: "infrastructure", pattern: /[/\\]infrastructure[/\\]/ },
  { layer: "app", pattern: /[/\\]src[/\\]app[/\\]/ },
  { layer: "components", pattern: /[/\\]src[/\\]components[/\\]/ },
  { layer: "tests", pattern: /[/\\]tests[/\\]|\.spec\.(ts|tsx)$/ },
  { layer: "legacy", pattern: /[/\\]legacy[/\\]/ },
];

export const PLATFORM_DIRS = [
  "design-process",
  "design-governance",
  "design",
  "render-engine",
  "prompt",
  "feedback",
  "memory",
  "commercial-intelligence-platform",
  "design-knowledge-platform",
  "render-blueprint",
] as const;

export const ARCHITECTURE_SCORE_WEIGHTS = {
  platformIsolation: 15,
  contractCompliance: 12,
  runtimeCompliance: 12,
  promptIsolation: 15,
  legacyIsolation: 10,
  providerIsolation: 10,
  assetIsolation: 8,
  testCoverage: 9,
  documentationCoverage: 9,
} as const;

export const TARGET_SCORE = 98;
