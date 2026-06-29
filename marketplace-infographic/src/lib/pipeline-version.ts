/** Версия пайплайна — отображается в /api/health и ответе генерации */
const renderV17 =
  process.env.RENDER_ENGINE_V17 === "1" || process.env.PIPELINE_V17 === "1";
const governanceOn =
  process.env.DESIGN_GOVERNANCE_V171 === "1" ||
  (renderV17 && process.env.DESIGN_GOVERNANCE_V171 !== "0");

export const PIPELINE_VERSION = governanceOn
  ? "v17.1-design-governance"
  : renderV17
    ? "v17.0-render-engine"
    : "v16.9-design-constitution";
