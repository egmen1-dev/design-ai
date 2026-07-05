# CODE REWRITE BIBLE

> **AUTO-GENERATED** — do not edit manually. Regenerate with `npm run architecture:scan`.

Generated: 2026-07-05T14:44:26.343Z  
Scanner root: `/workspace/marketplace-infographic`  
Architecture Bible: [Architecture_Bible.md](Architecture_Bible.md) Part 34

---

## 1. Repository Summary

| Metric | Value |
|--------|-------|
| **Total files scanned** | 905 |
| **Architecture score** | **86** / 98 target |
| **Critical risk** | 21 |
| **High risk** | 52 |
| **Medium risk** | 287 |
| **Low risk** | 545 |

### Files by layer

- **platforms**: 512
- **legacy**: 155
- **tests**: 141
- **unknown**: 54
- **platform-core**: 28
- **infrastructure**: 9
- **providers**: 5
- **assets**: 1

---

## 2. Architecture Score

Target: **≥ 98**

Current: **86**

Factors: platform isolation · contract compliance · runtime compliance · prompt isolation · legacy isolation · provider isolation · asset isolation · test coverage · documentation coverage

---

## 3. File Risk Ranking (top critical/high)

| Risk | File | Violations |
|------|------|------------|
| critical | `src/lib/design-process/pipeline.ts` | PROMPT_OUTSIDE_PROVIDER, DTO_NOT_REGISTERED, MISSING_DECISION_TRACE |
| critical | `src/components/PromptHints.tsx` | UNKNOWN_LAYER, PROMPT_OUTSIDE_PROVIDER |
| critical | `src/components/PromptHintsPreview.tsx` | UNKNOWN_LAYER, PROMPT_OUTSIDE_PROVIDER |
| critical | `src/lib/agents/commercial-photo-director/agent.ts` | PROMPT_OUTSIDE_PROVIDER, MISSING_DECISION_TRACE |
| critical | `src/lib/agents/commercial-photographer/agent.ts` | PROMPT_OUTSIDE_PROVIDER, MISSING_DECISION_TRACE |
| critical | `src/lib/design-process/creative-director-prompt.ts` | PROMPT_OUTSIDE_PROVIDER, MISSING_DECISION_TRACE |
| critical | `src/lib/design-process/prompts.ts` | PROMPT_OUTSIDE_PROVIDER, MISSING_DECISION_TRACE |
| critical | `src/lib/render-blueprint/render-adapter-engine.ts` | PROMPT_OUTSIDE_PROVIDER, RENDERING_MAKES_BUSINESS_DECISION |
| critical | `scripts/architecture-scanner/detect-violations.ts` | PROMPT_OUTSIDE_PROVIDER |
| high | `src/app/admin/page.tsx` | UNKNOWN_LAYER |
| high | `src/app/admin/references/page.tsx` | UNKNOWN_LAYER |
| high | `src/app/api/admin/badges/[id]/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/admin/badges/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/admin/examples/[id]/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/admin/examples/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/admin/fonts/[id]/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/admin/fonts/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/admin/intelligence-sync/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/admin/references/analyze/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/admin/references/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/ai/status/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/auth/[...nextauth]/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/auth/register/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/generate-infographic/route.ts` | UNKNOWN_LAYER |
| high | `src/app/api/generate/route.ts` | UNKNOWN_LAYER |

---

## 4. Critical Violations

- **RENDERING_MAKES_BUSINESS_DECISION**: 244 files — Render engine makes business decisions
- **UNKNOWN_LAYER**: 54 files — File layer could not be classified
- **MISSING_DECISION_TRACE**: 45 files — Creative/commercial path without DecisionTrace
- **PROMPT_OUTSIDE_PROVIDER**: 21 files — Prompt generation or import outside Provider Adapter
- **PROVIDER_LOGIC_IN_PLATFORM**: 11 files — Provider logic inside platform module
- **DTO_NOT_REGISTERED**: 3 files — DTO type not registered in contracts
- **PLATFORM_IMPORTS_PLATFORM**: 2 files — Platform imports another platform directly
- **MISSING_PROJECT_STATE**: 2 files — Orchestration without ProjectState
- **FILESYSTEM_ACCESS_OUTSIDE_ASSET_PLATFORM**: 2 files — Filesystem access outside Asset Platform
- **HTML_LAYOUT_OWNS_DESIGN**: 1 files — HTML template owns design layout

---

## 5. Module-by-Module Migration

### `src/lib/render-blueprint/` (416 files, 252 violations)

### `src/lib/design/` (141 files, 5 violations)

### `src/lib/agents/` (46 files, 16 violations)

### `src/lib/platform-core/` (28 files, 1 violations)

### `src/app/api/` (26 files, 26 violations)

### `src/lib/render-engine/` (23 files, 10 violations)

### `src/lib/design-governance/` (21 files, 2 violations)

### `src/lib/design-process/` (19 files, 25 violations)

### `src/lib/commercial-intelligence-platform/` (15 files, 11 violations)

### `src/lib/compositing/` (13 files, 0 violations)

### `src/lib/prompt/` (13 files, 0 violations)

### `src/lib/layout-engine/` (9 files, 0 violations)

### `src/lib/composition/` (7 files, 0 violations)

### `src/lib/design-ai-book/` (6 files, 0 violations)

### `src/app/admin/` (3 files, 2 violations)

### `src/lib/asset-selection/` (3 files, 0 violations)

### `src/lib/design-brief/` (3 files, 1 violations)

### `src/lib/design-knowledge-platform/` (3 files, 0 violations)

### `src/lib/feedback/` (3 files, 0 violations)

### `src/lib/human-ai-collaboration/` (3 files, 0 violations)

### `src/lib/intelligent-orchestration-platform/` (3 files, 0 violations)

### `src/app/login/` (2 files, 2 violations)

### `src/components/admin/` (2 files, 2 violations)

### `src/lib/example-engine/` (2 files, 0 violations)

### `scripts/architecture-scanner/analyze-imports.ts/` (1 files, 0 violations)

### `scripts/architecture-scanner/classify-file.ts/` (1 files, 0 violations)

### `scripts/architecture-scanner/detect-violations.ts/` (1 files, 1 violations)

### `scripts/architecture-scanner/generate-code-rewrite-bible-cli.ts/` (1 files, 0 violations)

### `scripts/architecture-scanner/generate-code-rewrite-bible.ts/` (1 files, 0 violations)

### `scripts/architecture-scanner/map-architecture.ts/` (1 files, 0 violations)

### `scripts/architecture-scanner/rules.ts/` (1 files, 0 violations)

### `scripts/architecture-scanner/scan-repository.ts/` (1 files, 0 violations)

### `scripts/architecture-scanner/types.ts/` (1 files, 0 violations)

### `src/app/dashboard/` (1 files, 1 violations)

### `src/app/how-it-works/` (1 files, 1 violations)

### `src/app/layout.tsx/` (1 files, 1 violations)

### `src/app/page.tsx/` (1 files, 1 violations)

### `src/app/pricing/` (1 files, 1 violations)

### `src/app/register/` (1 files, 1 violations)

### `src/components/AiStatusBanner.tsx/` (1 files, 1 violations)

---

## 6. File-by-File Migration (high risk)

### File: `scripts/architecture-scanner/detect-violations.ts`

| Field | Value |
|-------|-------|
| **Layer** | infrastructure |
| **Risk** | critical |
| **Lines** | 103 |
| **Directive** | TBD |

#### Current Responsibility

- tooling

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`infrastructure`

#### Required Changes

- None

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/admin/page.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 171 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/admin/references/page.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 55 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/admin/badges/[id]/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 25 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/admin/badges/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 66 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/admin/examples/[id]/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 21 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/admin/examples/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 115 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/admin/fonts/[id]/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 25 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/admin/fonts/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 70 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/admin/intelligence-sync/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 57 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/admin/references/analyze/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 114 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/admin/references/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 109 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/ai/status/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 18 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/auth/[...nextauth]/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 4 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/auth/register/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 46 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/generate-infographic/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 84 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/generate/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 124 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/generations/last-diagnostics/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 45 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/health/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 35 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/images/[id]/diagnostics/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 55 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/images/[id]/download/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 50 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/images/[id]/feedback/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 42 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/references/[filename]/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 44 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/regenerate-background/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 82 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/register/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 50 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/stripe/checkout/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 79 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/stripe/webhook/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 68 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/training/approve/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 70 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/api/upload/route.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 49 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/dashboard/page.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 102 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/how-it-works/page.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 106 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/layout.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 22 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/login/login-form.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 92 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/login/page.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 11 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/page.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 69 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/pricing/page.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 72 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/app/register/page.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 101 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/admin/AssetForms.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 388 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/admin/ReferenceUploadForm.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 228 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/AiStatusBanner.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 42 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/DownloadButton.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 33 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/FeedbackButtons.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 83 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/GenerateForm.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 671 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/GenerationDiagnosticsPanel.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 245 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/ImageGalleryCard.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 44 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/MarketplacePreview.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 62 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/PricingCard.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 84 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/PromptHints.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | critical |
| **Lines** | 100 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified
- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/PromptHintsPreview.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | critical |
| **Lines** | 32 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified
- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/Providers.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 8 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/RegisterForm.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 108 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/SiteFooter.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 21 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/components/SiteHeader.tsx`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 56 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/agents/art-director/agent.ts`

| Field | Value |
|-------|-------|
| **Layer** | legacy |
| **Risk** | critical |
| **Lines** | 52 |
| **Directive** | TBD |

#### Current Responsibility

- prompt

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/agents/chief-design-director/agent.ts`

| Field | Value |
|-------|-------|
| **Layer** | legacy |
| **Risk** | critical |
| **Lines** | 55 |
| **Directive** | TBD |

#### Current Responsibility

- prompt

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/agents/commercial-photo-director/agent.ts`

| Field | Value |
|-------|-------|
| **Layer** | legacy |
| **Risk** | critical |
| **Lines** | 60 |
| **Directive** | TBD |

#### Current Responsibility

- prompt
- commercial

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter
- **MISSING_DECISION_TRACE**: Creative/commercial path without DecisionTrace

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/agents/commercial-photographer/agent.ts`

| Field | Value |
|-------|-------|
| **Layer** | legacy |
| **Risk** | critical |
| **Lines** | 57 |
| **Directive** | TBD |

#### Current Responsibility

- prompt
- commercial

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter
- **MISSING_DECISION_TRACE**: Creative/commercial path without DecisionTrace

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/agents/marketplace-ctr-expert/agent.ts`

| Field | Value |
|-------|-------|
| **Layer** | legacy |
| **Risk** | critical |
| **Lines** | 57 |
| **Directive** | TBD |

#### Current Responsibility

- prompt

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/agents/senior-art-director/agent.ts`

| Field | Value |
|-------|-------|
| **Layer** | legacy |
| **Risk** | critical |
| **Lines** | 58 |
| **Directive** | TBD |

#### Current Responsibility

- prompt

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/agents/visual-story-director/agent.ts`

| Field | Value |
|-------|-------|
| **Layer** | legacy |
| **Risk** | critical |
| **Lines** | 60 |
| **Directive** | TBD |

#### Current Responsibility

- prompt

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/design-brief/sanitize.ts`

| Field | Value |
|-------|-------|
| **Layer** | legacy |
| **Risk** | critical |
| **Lines** | 97 |
| **Directive** | TBD |

#### Current Responsibility

- prompt

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/design-process/creative-director-prompt.ts`

| Field | Value |
|-------|-------|
| **Layer** | platforms |
| **Risk** | critical |
| **Lines** | 99 |
| **Directive** | DSP-001 |

#### Current Responsibility

- prompt
- creative

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter
- **MISSING_DECISION_TRACE**: Creative/commercial path without DecisionTrace

#### Keep

- Pending classification

#### Move

- Scene Planner → Visual Platform
- Prompt Builder → Provider Adapter

#### Delete

- None

#### Target Layer

`platforms`

#### Required Changes

- Replace DesignBrief with CreativeSpec
- Remove prompt generation (LAW-040)

#### Tests

- architecture
- unit
- integration

#### Acceptance

- no new violations

---

### File: `src/lib/design-process/pipeline.ts`

| Field | Value |
|-------|-------|
| **Layer** | platforms |
| **Risk** | critical |
| **Lines** | 316 |
| **Directive** | DSP-001 |

#### Current Responsibility

- prompt
- creative

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter
- **DTO_NOT_REGISTERED**: DTO type not registered in contracts
- **MISSING_DECISION_TRACE**: Creative/commercial path without DecisionTrace

#### Keep

- Pending classification

#### Move

- Scene Planner → Visual Platform
- Prompt Builder → Provider Adapter

#### Delete

- None

#### Target Layer

`platforms`

#### Required Changes

- Replace DesignBrief with CreativeSpec
- Remove prompt generation (LAW-040)

#### Tests

- architecture
- unit
- integration

#### Acceptance

- no new violations

---

### File: `src/lib/design-process/prompts.ts`

| Field | Value |
|-------|-------|
| **Layer** | platforms |
| **Risk** | critical |
| **Lines** | 157 |
| **Directive** | DSP-001 |

#### Current Responsibility

- prompt
- creative

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter
- **MISSING_DECISION_TRACE**: Creative/commercial path without DecisionTrace

#### Keep

- Pending classification

#### Move

- Scene Planner → Visual Platform
- Prompt Builder → Provider Adapter

#### Delete

- None

#### Target Layer

`platforms`

#### Required Changes

- Replace DesignBrief with CreativeSpec
- Remove prompt generation (LAW-040)

#### Tests

- architecture
- unit
- integration

#### Acceptance

- no new violations

---

### File: `src/lib/design/design-constitution/types.ts`

| Field | Value |
|-------|-------|
| **Layer** | platforms |
| **Risk** | critical |
| **Lines** | 167 |
| **Directive** | TBD |

#### Current Responsibility

- prompt
- knowledge

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`platforms`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/design/design-constitution/validators/pipeline.ts`

| Field | Value |
|-------|-------|
| **Layer** | platforms |
| **Risk** | critical |
| **Lines** | 98 |
| **Directive** | TBD |

#### Current Responsibility

- prompt
- knowledge

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`platforms`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/design/design-constitution/validators/stages.ts`

| Field | Value |
|-------|-------|
| **Layer** | platforms |
| **Risk** | critical |
| **Lines** | 81 |
| **Directive** | TBD |

#### Current Responsibility

- prompt
- knowledge

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`platforms`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/design/prompt-builder.ts`

| Field | Value |
|-------|-------|
| **Layer** | platforms |
| **Risk** | critical |
| **Lines** | 72 |
| **Directive** | TBD |

#### Current Responsibility

- prompt
- knowledge

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`platforms`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/generation/diagnostic-report.ts`

| Field | Value |
|-------|-------|
| **Layer** | legacy |
| **Risk** | critical |
| **Lines** | 408 |
| **Directive** | TBD |

#### Current Responsibility

- prompt

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/render-blueprint/render-adapter-engine.ts`

| Field | Value |
|-------|-------|
| **Layer** | platforms |
| **Risk** | critical |
| **Lines** | 413 |
| **Directive** | REN-002 |

#### Current Responsibility

- prompt
- rendering

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter
- **RENDERING_MAKES_BUSINESS_DECISION**: Render engine makes business decisions

#### Keep

- Pending classification

#### Move

- Prompt → Provider Adapter

#### Delete

- None

#### Target Layer

`platforms`

#### Required Changes

- Execute RenderBlueprint only
- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/lib/sd-stored-payload.ts`

| Field | Value |
|-------|-------|
| **Layer** | legacy |
| **Risk** | critical |
| **Lines** | 115 |
| **Directive** | TBD |

#### Current Responsibility

- prompt

#### Problems

- **PROMPT_OUTSIDE_PROVIDER**: Prompt generation or import outside Provider Adapter

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Remove prompt generation (LAW-040)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/types/next-auth.d.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 20 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---

### File: `src/types/potrace.d.ts`

| Field | Value |
|-------|-------|
| **Layer** | unknown |
| **Risk** | high |
| **Lines** | 17 |
| **Directive** | TBD |

#### Current Responsibility

- (inferred from path)

#### Problems

- **UNKNOWN_LAYER**: File layer could not be classified

#### Keep

- Pending classification

#### Move

- None

#### Delete

- None

#### Target Layer

`legacy`

#### Required Changes

- Classify into canonical layer (Part 27)

#### Tests

- architecture

#### Acceptance

- no new violations

---


---

## 7. Generated Cursor Tasks

- [ ] **GOV-002** — `src/lib/design-governance/blueprint/types.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/config.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/conflicts/detect.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/conflicts/types.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/constitution/gate.spec.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/constitution/gate.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/constitution/layout-harden.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/constitution/render-pass.spec.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/constitution/sanitize.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/decision/extractors.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/decision/types.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/design-governance.spec.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/index.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/resolver/resolver.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/scores/evaluate.spec.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/scores/evaluate.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/scores/generate-infographic-handler.ts` (2 violations)
- [ ] **GOV-002** — `src/lib/design-governance/scores/render-block.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/trace/trace.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/validators/render-block.ts` (0 violations)
- [ ] **GOV-002** — `src/lib/design-governance/version.ts` (0 violations)
- [ ] **DSP-001** — `src/lib/design-process/art-director-modes.ts` (1 violations)
- [ ] **DSP-001** — `src/lib/design-process/card-meaning.ts` (2 violations)
- [ ] **DSP-001** — `src/lib/design-process/category-art-directors.ts` (1 violations)
- [ ] **DSP-001** — `src/lib/design-process/concept-archetypes.ts` (1 violations)
- [ ] **DSP-001** — `src/lib/design-process/concept-evaluator.ts` (1 violations)
- [ ] **DSP-001** — `src/lib/design-process/concept-generator.ts` (1 violations)
- [ ] **DSP-001** — `src/lib/design-process/concept-similarity.ts` (1 violations)
- [ ] **DSP-001** — `src/lib/design-process/creative-concept.ts` (1 violations)
- [ ] **DSP-001** — `src/lib/design-process/creative-director-prompt.ts` (2 violations)

---

## 8. Acceptance Checklist

- [ ] Architecture score ≥ 98
- [ ] Zero PROMPT_OUTSIDE_PROVIDER violations
- [ ] Zero LEGACY_IMPORT_IN_RUNTIME violations
- [ ] All files classified (no unknown layer)
- [ ] ProjectState used in orchestration path
- [ ] Code Rewrite Bible regenerated after each migration wave

---

*END OF GENERATED CODE REWRITE BIBLE*
