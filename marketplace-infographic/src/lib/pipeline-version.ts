/** Версия пайплайна — отображается в /api/health и ответе генерации */
const renderBlueprintV18 = process.env.RENDER_BLUEPRINT_V18 === "1";
const renderV17 =
  process.env.RENDER_ENGINE_V17 === "1" || process.env.PIPELINE_V17 === "1";
const governanceOn =
  process.env.DESIGN_GOVERNANCE_V171 === "1" ||
  (renderV17 && process.env.DESIGN_GOVERNANCE_V171 !== "0");

export const PIPELINE_VERSION = renderBlueprintV18
  ? "v18.0-render-blueprint"
  : governanceOn
    ? "v17.1-design-governance"
    : renderV17
      ? "v17.0-render-engine"
      : "v16.9-design-constitution";
