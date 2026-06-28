/** Версия пайплайна — отображается в /api/health и ответе генерации */
/** Версия пайплайна — отображается в /api/health и ответе генерации */
export const PIPELINE_VERSION =
  process.env.RENDER_ENGINE_V17 === "1" || process.env.PIPELINE_V17 === "1"
    ? "v17.0-render-engine"
    : "v16.9-design-constitution";
