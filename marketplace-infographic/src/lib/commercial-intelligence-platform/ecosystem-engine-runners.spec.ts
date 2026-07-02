/**
 * Chapter 11 — ecosystem engine runners spec
 */
import assert from "node:assert/strict";
import { ECOSYSTEM_ENGINE_IDS } from "./ecosystem-engines";
import { runAllEcosystemEngines, runEcosystemEngine } from "./ecosystem-engine-runners";
import { DEFAULT_BOOK_PIPELINE_INPUT } from "../design-ai-book/pipeline";

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✔ ${name}`);
}

const input = DEFAULT_BOOK_PIPELINE_INPUT;

t("all 18 ecosystem engines have runners", () => {
  const { reports } = runAllEcosystemEngines(input);
  assert.equal(reports.length, ECOSYSTEM_ENGINE_IDS.length);
  assert.ok(reports.every((r) => r.valid));
});

t("11.1 consumer psychology outputs", () => {
  const r = runEcosystemEngine("consumer-psychology", input);
  assert.equal(r.chapterRef, "11.1");
  assert.ok(Array.isArray(r.outputs.emotionalTriggers));
});

t("11.11 revenue prediction", () => {
  const r = runEcosystemEngine("revenue-prediction", input);
  assert.ok(typeof r.outputs.revenueForecast === "number");
});

t("chain produces forecasts", () => {
  const { forecasts } = runAllEcosystemEngines(input);
  assert.ok(forecasts.ctrForecast > 0);
  assert.ok(forecasts.revenueForecast > 0);
});

console.log(`\necosystem-engine-runners.spec.ts — ${passed}/${passed} passed`);
