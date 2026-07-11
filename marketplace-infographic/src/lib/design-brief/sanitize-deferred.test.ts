import assert from "node:assert/strict";
import { sanitizeDesignBrief } from "./sanitize";

const longSpec = "А".repeat(120);

const brief = sanitizeDesignBrief(
  {
    layout: "marketplace",
    backgroundPrompt: "studio backdrop",
    oneThought: {
      question: "Главное преимущество?",
      answer: "1300",
      answerLabel: "Вт",
      headline: "Мощный триммер",
      deferredSpecs: [longSpec, "гарантия"],
    },
    deferredBullets: [longSpec],
  },
  "garden_tools",
  "Садовый триммер аккумуляторный",
);

assert.equal(brief.oneThought?.deferredSpecs[0]?.length, 80);
assert.equal(brief.deferredBullets?.[0]?.length, 80);
console.log("sanitize-deferred.test.ts: ok");
