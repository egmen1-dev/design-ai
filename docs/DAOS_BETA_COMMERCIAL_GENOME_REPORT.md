# DAOS Beta — Commercial Genome Beta Report

| Field | Value |
|-------|-------|
| **Wave** | Beta (pre-RFC-2200) |
| **Branch** | `cursor/commercial-genome-beta-aecb` |
| **Flag** | `DAOS_COMMERCIAL_GENOME_BETA` (default `0`, Shadow) |
| **Module** | `marketplace-infographic/src/lib/daos/commercial-genome-beta/` |

---

## 1. What Was Implemented

Minimal **Commercial Genome Beta** runtime — Experimental Knowledge Base v1.0 encoded as deterministic rules, resolved by KRE Beta, converted to commercial decisions, and wired into generation when the feature flag is on.

| Component | File | Role |
|-----------|------|------|
| Types | `types.ts` | `CommercialRuleBeta`, `CommercialDecisionBeta`, diagnostics |
| Knowledge | `wildberries-hero-rules.ts` | 52 EKB v1.0 rules (runtime SSOT) |
| KRE Beta | `resolve-commercial-rules.ts` | `resolveCommercialRulesBeta()` — deterministic selection |
| DecisionGraph Beta | `commercial-decision-beta.ts` | `buildCommercialDecisionBeta()` |
| Genome API | `commercial-genome-beta.ts` | `createCommercialGenomeBetaDecision()`, flag helpers |
| Tests | `commercial-genome-beta.test.ts` | 9 acceptance tests |
| Flag | `feature-flag-registry` | `DAOS_COMMERCIAL_GENOME_BETA` registered |

**Pipeline when flag=1:**

```text
GenerationContext inputs
  → Commercial Genome Beta (52 rules)
  → KRE Beta (resolveCommercialRulesBeta)
  → DecisionGraph Beta (buildCommercialDecisionBeta)
  → Prompt snippet injection (genomeSnippet)
  → Diagnostics / payload / generation diagnostic
```

---

## 2. Experimental Knowledge Base v1.0 — Rules Transferred

**52 runtime rules** from real Wildberries Hero experiments (`source: experimental_knowledge_base_v1`):

| Category | Count | IDs |
|----------|-------|-----|
| Hero | 7 | WB-HERO-001 … WB-HERO-007 |
| Hierarchy | 5 | WB-HIER-001 … WB-HIER-005 |
| Typography | 6 | WB-TYPE-001 … WB-TYPE-006 |
| Psychology | 5 | WB-PSY-001 … WB-PSY-005 |
| Environment | 7 | WB-ENV-001 … WB-ENV-007 |
| Differentiation | 4 | WB-DIFF-001 … WB-DIFF-004 |
| Brand | 4 | WB-BRAND-001 … WB-BRAND-004 |
| Research | 4 | WB-RES-001 … WB-RES-004 |
| Refinement | 4 | WB-REF-001 … WB-REF-004 |
| Anti-rules | 6 | WB-ANTI-001 … WB-ANTI-006 |

All mandatory EKB topics from the Beta task are covered (Hero design, visual hierarchy, typography, psychology, environment, differentiation, Brand DNA, research, refinement, anti-rules).

---

## 3. Runtime Knowledge vs Documentation

| EKB knowledge | Runtime artifact |
|---------------|------------------|
| Hero sells interest, one idea, 3–4 chars | `CommercialDecisionBeta.maxCharacteristics=4`, rule WB-HERO-* |
| Product 50–60% area | `productAreaTarget=0.55` |
| Attention order product→headline→chars→logo | `visualHierarchy[]` |
| Result-oriented copy | `mainMessage`, `typographyDirection` |
| Environment by category | `environmentDirection` resolver |
| Yellow product contrast | `backgroundContrastDirection=cool_neutral_separation` |
| Professional tool scene | `clean_industrial_technical` |
| Rule of One Change | refinement rules when `mode=refinement` |
| Anti-rules (no collage, no text on product, etc.) | always selected; injected in prompt snippet |

These are **not** documentation-only — they execute in `createCommercialGenomeBetaDecision()` on every flagged marketplace generation.

---

## 4. Feature Flag

| Field | Value |
|-------|-------|
| **FlagId** | `DAOS_COMMERCIAL_GENOME_BETA` |
| **Owner** | Commercial Genome Beta |
| **Lifecycle** | Shadow |
| **Default** | `0` |
| **Category** | Commercial (noted in registry Notes; type `runtime`) |
| **plannedRemovalWave** | TBD_AFTER_BETA_VALIDATION |

**When `DAOS_COMMERCIAL_GENOME_BETA=1`:**

- Commercial decision computed for `layout=marketplace`
- `commercialGenomeBeta` added to `payloadExtras` / stored JSON
- `commercial_genome_beta` diagnostic step added
- Prompt compiler receives `[Commercial Genome Beta]` snippet via `genomeSnippet`
- Console log: `[commercial-genome-beta] environment contrast rules=N`

**When flag off (`0` or unset):** zero behavior change — no decision, no snippet, no diagnostic step.

---

## 5. What Was NOT Touched

- No RFC-2200 / full Commercial Genome architecture implementation
- No database, Learning Engine, Research Platform
- No handler refactor — additive integration only
- No SceneGraph / DecisionGraph production modules
- No Constitution or RFC changes
- No changes to legacy prompt compiler internals (snippet append only)

---

## 6. How This Helps Beta

1. **Commercial decisions before render** — environment, contrast, hierarchy, and anti-rules are decided deterministically from real WB experiments.
2. **Traceable** — full `decisionTrace` in diagnostics for debugging bad cards.
3. **Safe rollout** — Shadow flag; default off preserves production behavior.
4. **Prompt influence** — genome snippet reaches background prompt compilation without rewriting the compiler.
5. **Foundation for Wave 43** — same rule IDs and types can migrate to full Commercial Genome when ready.

---

## 7. How to Test

### Unit tests

```bash
cd marketplace-infographic
npx tsx src/lib/daos/commercial-genome-beta/commercial-genome-beta.test.ts
bash scripts/run-specs.sh
npm run lint
```

### Manual Beta generation

```bash
export DAOS_COMMERCIAL_GENOME_BETA=1
# run marketplace generation as usual
```

Verify in output:

- `generatedJson.commercialGenomeBeta.decision.environmentDirection`
- `generationDiagnostic.steps` contains `commercial_genome_beta`
- Background prompt includes `[Commercial Genome Beta]`

### Scenarios to validate

| Scenario | Expected |
|----------|----------|
| WB marketplace card | hero + hierarchy + psychology rules selected |
| Yellow product | `backgroundContrastDirection: cool_neutral_separation` |
| Professional tool category | `environmentDirection: clean_industrial_technical` |
| `mode=refinement` | WB-REF-004 Rule of One Change selected |
| Flag off | no `commercialGenomeBeta` in payload |

---

## 8. Verification Results

| Check | Result |
|-------|--------|
| `commercial-genome-beta.test.ts` | PASS (9/9) |
| `bash scripts/run-specs.sh` | PASS |
| `npm run lint` | PASS |
| `npx tsc --noEmit` | FAIL — **pre-existing** `tmp/wave*-ab-run.ts` errors only; no new errors in Beta module |

---

## 9. Next Beta Steps (Out of Scope)

- Wire `productAreaTarget` into layout engine / LAW_003
- Commercial Critics Beta consuming `CommercialDecisionBeta`
- Expand KRE with competitor card analysis input
- Promote flag to Canary after WB card quality review

---

**END OF BETA COMMERCIAL GENOME REPORT**
