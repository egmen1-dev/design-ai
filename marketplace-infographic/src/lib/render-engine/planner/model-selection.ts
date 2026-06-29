import type { RenderModelId, RenderProfileId } from "../types";
import { MODEL_SELECTION_RULES, RETRY_MODEL_CHAIN } from "../config";
import { getRenderProfile } from "../profiles";

export function selectRenderModel(input: {
  profileId: RenderProfileId;
  attemptIndex?: number;
  override?: RenderModelId;
}): RenderModelId {
  if (input.override) return input.override;

  const attempt = input.attemptIndex ?? 0;
  if (attempt > 0 && attempt <= RETRY_MODEL_CHAIN.length) {
    return RETRY_MODEL_CHAIN[attempt - 1];
  }

  const profile = getRenderProfile(input.profileId);
  const rule = MODEL_SELECTION_RULES.find((r) => r.profileId === input.profileId);
  return rule?.modelId ?? profile.preferredModel;
}

export function selectModelForRetry(
  failedModel: RenderModelId,
  attemptIndex: number,
): RenderModelId {
  const idx = RETRY_MODEL_CHAIN.indexOf(failedModel);
  const next = idx >= 0 ? RETRY_MODEL_CHAIN[idx + 1] : RETRY_MODEL_CHAIN[attemptIndex];
  return next ?? "flux";
}
