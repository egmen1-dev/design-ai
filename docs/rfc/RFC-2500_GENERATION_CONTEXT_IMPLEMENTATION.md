# RFC-2500 — GenerationContext Implementation (Phase A2)

| Field | Value |
|-------|-------|
| **RFC Number** | RFC-2500 |
| **Title** | GenerationContext Runtime — minimal SSOT for generation context |
| **Author** | DAOS Architecture Council (Audit-driven) |
| **Status** | Accepted |
| **Layer** | Foundation / Execution |
| **Normative** | Mandatory after acceptance |
| **Constitution** | [Volume 25 — Generation Context Model](../architecture/constitution-v3/volume-25-generation-context-model/) |
| **Audit** | Architecture Compliance Report 2026-07-07 — Violation **V-005** |
| **Roadmap** | [Phase A2](../roadmap/IMPLEMENTATION_ROADMAP.md) |
| **Predecessor** | [RFC-2600 Metric Registry Runtime](RFC-2600_METRIC_REGISTRY_RUNTIME.md) (Accepted, Wave 35) |

Related: [RFC-2500 (constitution)](../architecture/constitution-v3/volume-25-generation-context-model/part-01/RFC-2500.md) · [SPEC-2500](../architecture/constitution-v3/volume-25-generation-context-model/part-01/SPEC-2500.md) · [RFC-010](RFC-010_ARCHITECTURE_COUNCIL.md) · [RFC-2400](../architecture/constitution-v3/volume-24-knowledge-resolution-engine/part-01/RFC-2400.md) (future) · [RFC-600-R](../architecture/constitution-v3/volume-06-decision-engine/part-01/RFC-600.md) (future)

---

# 1. Problem

DAOS Constitution Volume 25 defines **GenerationContext** as the single immutable object describing everything required for one commercial generation. Every subsystem SHALL consume the same context; local context reconstruction is prohibited (RFC-2500 constitution).

**Current reality:** generation context does not exist as a runtime type. Context is assembled implicitly inside `generate-infographic-handler.ts` from dozens of local variables (`analysis`, `designBrief`, `sdData`, `compositionLayout`, `renderEngineResult`, `daosState`, etc.) and partially mirrored into diagnostics-only structures.

**Consequences:**

| Symptom | Impact |
|---------|--------|
| No canonical context object | Subsystems cannot share one SSOT |
| Handler owns all context assembly | Violates Ownership, SRP (Vol 21) |
| `DAOSPipelineContext` is spec-summary only | Cannot drive generation or replay |
| Context scattered across modules | Knowledge Resolution / DecisionGraph blocked |
| Debug bundle reconstructs fragments | Replay and audit trail incomplete |

This RFC introduces a **minimal runtime GenerationContext** without decomposing the handler, following the same strangler pattern as RFC-2600 Wave 35.

---

# 2. Audit evidence

## 2.1 `DAOSPipelineContext` is debug-only today

```typescript
// daos-pipeline-context.ts — comment in source:
/** Unified DAOS pipeline context from enriched ProjectState (diagnostics only). */
export function createDaosPipelineContext(state: DAOSProjectState): DAOSPipelineContext
```

`DAOSPipelineContext` contains:

- `projectId`, `runId`, `generationMode`
- Spec snapshots: `knowledgeSpec`, `commercialSpec`, `creativeSpec`, `visualBlueprint`, `renderBlueprint`
- `completenessScore`, `missingSpecs`, `warnings`

It is built from `DAOSProjectState` **after** enrichment, used for:

- `createDaosPromptContextBlock()` (optional prompt injection)
- `summarizeDaosPipelineContext()` → debug bundle `pipelineContextSummary`
- Render-engine context adapter (bridge)

It does **not** capture product input, marketplace constraints, provider selection, operating mode, or asset paths at generation start. It is **not** immutable SSOT — it is a derived diagnostic view of specs.

## 2.2 Handler assembles context itself

`handleGenerateInfographic()` (~3400 lines) directly owns:

| Context fragment | Source in handler |
|------------------|-------------------|
| Product | `analysis`, `productImage`, `sdData`, `productCutoutPath` |
| Input / brief | `designBrief`, `prompt`, `ollamaContext` |
| Marketplace | `sdData.layout === "marketplace"`, `marketIntelligence`, `ctrReview` |
| Category | `analysis.category`, `productCategory` |
| Generation mode | `resolveDaosGenerationMode()` |
| Render / provider | `renderEngineResult`, `useRenderEngineV17`, `backgroundSource` |
| Diagnostics | audits, patches, scene graph — assembled at end |

`createDaosPipelineContext()` is called **late** (post-enrichment, ~line 2785) and again interim for prompt bridges (~line 1561). Two different pipeline states may produce different contexts within one run.

## 2.3 Context spread across subsystems

```text
GenerateInfographicInput
  → design-brief / product-analysis / composition
  → enrichDaosStateFromPipeline()
  → DAOSProjectState (specs)
  → DAOSPipelineContext (spec summary)
  → DAOSRenderEngineContextSummary (bridge)
  → DaosDebugBundle.diagnostics (flat key-value)
  → DaosDebugBundle.specs (state copy)
```

No single object links `productImage` → `analysis.category` → `generationMode` → `renderProvider` → `diagnostics.productAreaRatio` for one `runId`.

## 2.4 Replay is impossible

To replay generation run `projectId/runId` today:

- Debug bundle has partial `specs` and flat `diagnostics`
- No frozen input context at generation start
- `DAOSPipelineContext` is recomputed from final state, not snapshotted at init
- Handler-local variables (`compositionLayout`, `compositeResult`, interim bridges) are not serialized as one context

**Violation:** V-005 (GenerationContext absent), Vol 19 invariants (no SSOT for generation state).

---

# 3. Scope — Wave 1 (this RFC implementation)

## 3.1 In scope

| Item | Detail |
|------|--------|
| Runtime module | `marketplace-infographic/src/lib/daos/generation-context/` |
| Canonical type | `GenerationContext` (typed, documented fields) |
| Builder | `buildGenerationContext(input): GenerationContext` |
| Population source | Existing handler-local values passed as **read-only input struct** |
| Persistence | Serialize to debug bundle only (JSON snapshot) |
| Feature flag | `DAOS_GENERATION_CONTEXT=1` enables build + attach; default off |
| Usage | Read-only; no consumer behavior change in Wave 1 |

## 3.2 Wave 1 behavior

```text
Handler (unchanged control flow)
  → collect already-resolved values into GenerationContextBuildInput
  → buildGenerationContext(input)   [if flag=1]
  → attach snapshot to debug bundle
  → all existing paths continue unchanged
```

## 3.3 Out of scope (Wave 1)

| Item | Deferred |
|------|----------|
| Handler decomposition | RFC-900-R |
| `DAOSPipelineContext` replacement | Wave 2 |
| Knowledge Resolution / DecisionGraph input | Wave 3 |
| Replay CLI / API | Wave 4 |
| Metric Registry values inside context | Optional Wave 2 (reference by id) |
| Object Registry validation | RFC-2700 |

---

# 4. Non-goals (explicit prohibitions)

Per Architecture Council directive:

1. **Do not decompose** `generate-infographic-handler.ts`
2. **Do not migrate** DecisionGraph or commercial reasoning
3. **Do not replace** `DAOSPipelineContext` in Wave 1
4. **Do not change** `GenerateInfographicResult` public API response shape
5. **Do not change** render engine, provider adapters, or image output
6. **Do not change** benchmark pipeline or benchmark metrics extraction
7. **Do not remove** legacy context types (`DAOSPipelineContext`, `DAOSProjectState`, interim bridges)
8. **Do not create** a new orchestrator or agent
9. **Do not export** `GenerationContext` from `daos/index.ts` public API in Wave 1 (internal module only)

---

# 5. Canonical `GenerationContext` fields (Wave 1 subset)

Wave 1 implements a **minimal constitution-aligned subset**. Full Vol 25 fields (Audience, Brand, LearningContext, etc.) are deferred with explicit `undefined` + `missingFields` tracking.

```typescript
type GenerationContext = {
  /** Immutable after build */
  readonly metadata: GenerationContextMetadata;
  readonly product: GenerationContextProduct;
  readonly marketplace: GenerationContextMarketplace;
  readonly category: GenerationContextCategory;
  readonly operatingMode: GenerationContextOperatingMode;
  readonly generationMode: GenerationContextGenerationMode;
  readonly assets: GenerationContextAssets;
  readonly constraints: GenerationContextConstraints;
  readonly provider: GenerationContextProvider;
  readonly diagnostics: GenerationContextDiagnostics;
};

type GenerationContextMetadata = {
  generationId: string;       // `${projectId}:${runId}`
  projectId: string;
  runId: string;
  requestId?: string;
  protocolVersion: string;    // e.g. "daos-v3"
  constitutionVersion: string; // e.g. "3.0"
  createdAt: string;          // ISO-8601
  schemaVersion: string;      // GenerationContext schema, e.g. "1.0.0"
};

type GenerationContextProduct = {
  productId?: string;
  title?: string;
  imagePath?: string;
  cutoutPath?: string;
  aspectRatio?: number;
  attributes?: Record<string, string | number | boolean>;
  analysisCategory?: string;
  verified: boolean;          // true when analysis/product pipeline completed
};

type GenerationContextMarketplace = {
  layout: "marketplace" | "other";
  marketplaceId?: string;     // e.g. "wildberries" when known
  channel?: string;
  intelligenceActive: boolean;
};

type GenerationContextCategory = {
  primary?: string;
  hints?: string[];
  genomeKey?: string;
  knowledgeCategory?: string;
};

type GenerationContextOperatingMode = {
  mode: "production" | "exploration";  // Vol 18 alignment
  explorationFlags: string[];          // active DAOS_* flags at build time
};

type GenerationContextGenerationMode = {
  mode: DAOSGenerationMode;           // draft | balanced | premium | enterprise
  policy: Pick<DAOSGenerationPolicy, "minimumFinalScore" | "allowFastShortcuts" | "enableDebugBundle">;
};

type GenerationContextAssets = {
  backgroundUrl?: string | null;
  finalImagePath?: string;
  productImageInput?: string;
  existingImageId?: string;
};

type GenerationContextConstraints = {
  style?: string;
  renderModel?: string;
  regenerateBackgroundOnly?: boolean;
  fastGeneration?: boolean;
  constitutionVersion?: string;
};

type GenerationContextProvider = {
  renderProvider?: string;
  renderModel?: string;
  renderEngineVersion?: string;
  backgroundSource?: "sd" | "fallback" | "provider";
  aiSource?: string;
};

type GenerationContextDiagnostics = {
  /** Wave 1: completeness only; no audit scores */
  completenessScore: number;          // 0–100
  missingFields: string[];
  pipelineContextCompleteness?: number; // mirror DAOSPipelineContext score when available
};
```

### Field mapping (Wave 1 — from existing handler values)

| Field | Primary source (no new fetches) |
|-------|--------------------------------|
| `metadata.*` | `daosState.projectId`, `daosState.runId`, wall clock |
| `product.*` | `analysis`, `productImage`, `productCutoutPath`, `sdData` |
| `marketplace.layout` | `sdData.layout` |
| `marketplace.intelligenceActive` | `!!marketIntelligence` |
| `category.*` | `analysis.category`, `knowledgeCategory`, `designGenomeKey` |
| `operatingMode` | derive from env flags (exploration if any experimental DAOS_* on) |
| `generationMode` | `resolveDaosGenerationMode()`, `getDaosGenerationPolicy()` |
| `assets.*` | paths/urls already in handler at bundle time |
| `constraints.*` | `GenerateInfographicInput` fields |
| `provider.*` | `renderEngineResult`, `backgroundSource`, `aiSource` |
| `diagnostics.*` | computed from populated vs required fields |

---

# 6. Ownership

| Object | Owner | Wave 1 consumers |
|--------|-------|------------------|
| `GenerationContext` | **Generation Engine** (`daos/generation-context/`) | Debug bundle writer (read-only) |
| `DAOSPipelineContext` | Pipeline diagnostics (unchanged owner) | Prompt bridge, meaning-loss (unchanged) |
| `DAOSProjectState` | Project state core (unchanged) | Handler, adapters (unchanged) |

**Rules:**

- Only `buildGenerationContext()` may construct `GenerationContext`
- Consumers **read only**; mutation prohibited (readonly types + `Object.freeze` in builder)
- Handler **passes data** to builder; it does not own context schema
- No subsystem may reconstruct GenerationContext from partial state (Vol 25)

---

# 7. Migration plan

## Wave 1 — Create + populate + debug bundle (this RFC)

| Step | Action | Behavior change |
|------|--------|-----------------|
| W1.1 | Add `generation-context/` module | None |
| W1.2 | Implement `buildGenerationContext()` | None |
| W1.3 | Handler: **one call site** before `createDaosDebugBundle`, flag-gated | None (flag off) |
| W1.4 | Attach `generationContext` snapshot to debug bundle | Additive JSON field |
| W1.5 | Add diagnostics fields (§9) | Additive |
| W1.6 | Unit tests + equivalence completeness | None |

**Exit criteria:** With `DAOS_GENERATION_CONTEXT=0`, byte-identical API response and render output on test corpus.

## Wave 2 — DAOSPipelineContext builder integration

| Step | Action |
|------|--------|
| W2.1 | `createDaosPipelineContext()` accepts optional `GenerationContext` reference |
| W2.2 | Completeness derived from context + state |
| W2.3 | `pipelineContextSummary` includes `generationContextGenerationId` link |

## Wave 3 — Knowledge Resolution / DecisionGraph

| Step | Action |
|------|--------|
| W3.1 | KRE reads `GenerationContext.category`, `product`, `marketplace` |
| W3.2 | DecisionGraph stores `generationId` on every decision node |
| W3.3 | Metric Registry values referenced by `metricId` in context extension |

## Wave 4 — Replay support

| Step | Action |
|------|--------|
| W4.1 | `loadGenerationContext(bundlePath): GenerationContext` |
| W4.2 | Replay harness validates context schema version |
| W4.3 | CI fixture: rebuild context from bundle ≡ original |

---

# 8. Compatibility

| Dimension | Requirement |
|-----------|-------------|
| `GenerateInfographicResult` | Unchanged shape and values |
| Rendered images | Identical pixel output |
| `DAOSPipelineContext` | Still created; not removed or renamed |
| Debug bundle | Additive fields only (`generationContext`, diagnostics keys) |
| Feature flag default | `DAOS_GENERATION_CONTEXT` unset / `0` → builder not called |
| Handler control flow | No stage reordering; **one additive call** before debug bundle |
| Public `daos/index.ts` exports | No new exports in Wave 1 |

**Additive-only contract:**

```typescript
// DaosDebugBundle — Wave 1 extension
generationContext?: GenerationContextSnapshot;
diagnostics: {
  // existing fields unchanged
  generationContextCreated?: boolean;
  generationContextPath?: string;
  generationContextCompleteness?: number;
  generationContextMissingFields?: string[];
};
```

---

# 9. Diagnostics

When `DAOS_GENERATION_CONTEXT=1`, debug bundle diagnostics SHALL include:

| Field | Type | Description |
|-------|------|-------------|
| `generationContextCreated` | `boolean` | `true` if builder ran successfully |
| `generationContextPath` | `string?` | Relative path to serialized snapshot file (if written to disk) |
| `generationContextCompleteness` | `number` | 0–100; % of required Wave-1 fields populated |
| `generationContextMissingFields` | `string[]` | Dot-paths of missing required fields, e.g. `product.aspectRatio` |

**Completeness formula (Wave 1):**

```text
requiredFields = [
  metadata.generationId,
  metadata.projectId,
  metadata.runId,
  product.verified,
  marketplace.layout,
  generationMode.mode,
  operatingMode.mode,
]
completeness = round(present / required * 100)
```

Snapshot file path (optional Wave 1): `public/debug/{projectId}/{runId}/generation-context.json`

---

# 10. Tests required

## 10.1 Unit tests — `generation-context-build.test.ts`

| Test | Assertion |
|------|-----------|
| Minimal valid input | `buildGenerationContext()` returns frozen object |
| `metadata.generationId` | `${projectId}:${runId}` |
| Marketplace layout | `marketplace` when `sdData.layout === "marketplace"` |
| Generation mode | Matches `resolveDaosGenerationMode()` input |
| Operating mode production | No exploration flags → `production` |
| Operating mode exploration | `DAOS_METRIC_REGISTRY_SHADOW=1` → `exploration` + flag listed |
| Completeness | 100 when all required fields present |
| Missing fields | `missingFields` lists dot-paths; completeness < 100 |
| Immutability | `Object.isFrozen(context)` |

## 10.2 Integration tests — flag gating

| Test | Assertion |
|------|-----------|
| `DAOS_GENERATION_CONTEXT=0` | Debug bundle has no `generationContext`; `generationContextCreated` false/undefined |
| `DAOS_GENERATION_CONTEXT=1` | `generationContext` present; diagnostics populated |
| API response | Unchanged with flag on/off (fixture handler test or snapshot) |

## 10.3 Equivalence tests

| Test | Assertion |
|------|-----------|
| Pipeline context coexistence | `DAOSPipelineContext` still created when GenerationContext enabled |
| No double-build | Single `buildGenerationContext` call per run |

## 10.4 CI commands

```bash
npx tsx src/lib/daos/tests/generation-context-build.test.ts
npm run daos:test
npm run daos:spec
npm run lint
npm run typecheck   # pre-existing tmp/* failures documented if unchanged
```

---

# 11. Acceptance criteria

RFC-2500 Wave 1 is **Accepted** when:

- [ ] Architecture Council review complete (RFC-010)
- [ ] `GenerationContext` type matches §5 Wave-1 subset
- [ ] `buildGenerationContext()` is sole constructor
- [ ] Handler adds **≤ 30 lines** (one build call + input struct); no refactor
- [ ] `DAOS_GENERATION_CONTEXT=0` → zero behavior change (tests prove)
- [ ] `DAOS_GENERATION_CONTEXT=1` → debug bundle contains snapshot + §9 diagnostics
- [ ] `DAOSPipelineContext` unchanged in Wave 1
- [ ] No changes to `GenerateInfographicResult`, render, benchmark, public API
- [ ] Wave report document created (`docs/DAOS_WAVE_36_GENERATION_CONTEXT_REPORT.md`)

---

# 12. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Handler touch despite "no refactor" | High | Single call site; flag-gated; line budget in PR review |
| Duplication with `DAOSPipelineContext` | Medium | Wave 2 convergence plan; different ownership documented |
| Schema drift vs constitution Vol 25 | Medium | `schemaVersion` field; explicit `missingFields` for deferred fields |
| Debug bundle size growth | Low | Compact snapshot; omit large spec blobs (reference `specs` section) |
| Exploration mode misclassification | Medium | Explicit flag list in `operatingMode.explorationFlags` |
| Teams bypass builder | Medium | Wave 4 CI guard; Vol 25 lint rule (future) |

---

# 13. Rollback plan

| Level | Action |
|-------|--------|
| **L0 — Flag** | Set `DAOS_GENERATION_CONTEXT=0` (default); builder skipped |
| **L1 — Deploy** | Revert Wave 1 PR; debug bundle loses additive fields only |
| **L2 — Data** | Old debug bundles without `generationContext` remain valid; no migration |
| **L3 — Code** | Remove `generation-context/` module; remove handler call site (~30 lines) |

No rollback impact on render output, API, or benchmarks.

---

# 14. Module layout (proposed)

```text
src/lib/daos/generation-context/
├── index.ts                    # internal exports (not daos/index.ts in W1)
├── types.ts                    # GenerationContext* types
├── build-generation-context.ts # buildGenerationContext()
├── completeness.ts             # completeness + missingFields
├── operating-mode.ts           # production vs exploration derivation
├── snapshot.ts                 # serialize / deserialize for debug bundle
└── tests/
    └── generation-context-build.test.ts
```

---

# 15. Feature flag

| Flag | Default | Purpose |
|------|---------|---------|
| `DAOS_GENERATION_CONTEXT` | `0` | Enable build + debug bundle attach |

Temporary until Feature Flag Registry (RFC-2800).

---

# 16. Alternatives considered

| Alternative | Verdict | Reason |
|-------------|---------|--------|
| Expand `DAOSPipelineContext` in place | **Rejected for W1** | Overloads diagnostics type; breaks spec-summary semantics |
| Full handler decomposition first | **Rejected** | Violates scope; RFC-900-R prerequisite |
| Store context only in `DAOSProjectState` | **Rejected** | State is mutable; Vol 25 requires immutable init snapshot |
| JSON schema without TypeScript types | **Rejected** | No compile-time safety for Wave 2 consumers |

---

# 17. Council decision

| Role | Decision | Date |
|------|----------|------|
| Architecture Auditor | Proposed | 2026-07-08 |
| Architecture Council | **Accepted** | 2026-07-08 |
| Engineering Lead | _Pending_ | — |

**Status transitions:** `Draft → Review → Accepted → Implemented (Wave 1) → Released`

---

*Normative generation context rules remain in [Constitution Volume 25](../architecture/constitution-v3/volume-25-generation-context-model/).*
