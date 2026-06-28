import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { VisualSceneBlueprint } from "@/lib/design/visual-pipeline/types";
import type { PollinationsCompiledPrompt } from "../adapters/pollinations-compiler";

export type RenderDebugArtifacts = {
  requestId: string;
  sceneBlueprint: VisualSceneBlueprint;
  pollinationsPrompt: PollinationsCompiledPrompt;
  providerResponse?: { ok: boolean; modelId: string; latencyMs?: number; error?: string };
  backgroundPath?: string;
  finalSlidePath?: string;
};

export async function saveRenderDebugArtifacts(
  artifacts: RenderDebugArtifacts,
  baseDir?: string,
): Promise<string> {
  const dir = baseDir ?? path.join(process.cwd(), "public", "debug", artifacts.requestId);
  await mkdir(dir, { recursive: true });

  await writeFile(
    path.join(dir, "scene_blueprint.json"),
    JSON.stringify(artifacts.sceneBlueprint, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(dir, "pollinations_prompt.txt"),
    artifacts.pollinationsPrompt.prompt,
    "utf8",
  );
  await writeFile(
    path.join(dir, "pollinations_negative.txt"),
    artifacts.pollinationsPrompt.negativePrompt,
    "utf8",
  );
  if (artifacts.providerResponse) {
    await writeFile(
      path.join(dir, "provider_response.json"),
      JSON.stringify(artifacts.providerResponse, null, 2),
      "utf8",
    );
  }
  if (artifacts.backgroundPath) {
    await writeFile(path.join(dir, "background_path.txt"), artifacts.backgroundPath, "utf8");
  }
  if (artifacts.finalSlidePath) {
    await writeFile(path.join(dir, "final_slide_path.txt"), artifacts.finalSlidePath, "utf8");
  }

  return dir;
}
