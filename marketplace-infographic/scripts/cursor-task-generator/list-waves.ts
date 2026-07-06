#!/usr/bin/env npx tsx
import { generateTaskPlan } from "./TaskGenerator";
import { WAVE_DEFINITIONS } from "./types";

const plan = generateTaskPlan();
for (const def of WAVE_DEFINITIONS) {
  const wave = plan.waves.find((w) => w.wave === def.wave)!;
  const ready = wave.tasks.filter((t) => t.state === "Ready").length;
  console.log(
    `Wave ${String(def.wave).padStart(2, "0")} ${def.name.padEnd(28)} tasks=${wave.tasks.length} ready=${ready}`,
  );
}
