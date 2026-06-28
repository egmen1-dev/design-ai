import { USE_RENDER_ENGINE_V17 } from "@/lib/render-engine/config";

/** Design Governance Layer v17.1 — on by default with Render Engine v17 */
export const USE_DESIGN_GOVERNANCE =
  process.env.DESIGN_GOVERNANCE_V171 === "1" ||
  (USE_RENDER_ENGINE_V17 && process.env.DESIGN_GOVERNANCE_V171 !== "0");

/** Gradient fallback only when explicitly allowed after all provider retries */
export const ALLOW_GRADIENT_FALLBACK =
  process.env.GOVERNANCE_ALLOW_GRADIENT_FALLBACK === "1";

/** Governance constitution pass threshold — auto-fix loops until this score */
export const GOVERNANCE_CONSTITUTION_THRESHOLD = Number(
  process.env.GOVERNANCE_CONSTITUTION_THRESHOLD ?? 80,
);

export const GOVERNANCE_CONSTITUTION_MAX_ATTEMPTS = Number(
  process.env.GOVERNANCE_CONSTITUTION_MAX_ATTEMPTS ?? 12,
);
