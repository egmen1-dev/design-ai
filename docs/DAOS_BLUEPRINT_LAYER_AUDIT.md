# DAOS Blueprint Layer — Architectural Audit

| Field | Value |
|-------|-------|
| **Status** | Audit complete (code-based) |
| **Date** | 2026-07-09 |
| **Scope** | `marketplace-infographic/src/lib/` |
| **Prerequisite waves** | 35–38B complete; Commercial Genome Beta on branch `cursor/commercial-genome-beta-aecb` |
| **Rule** | No new Commercial Blueprint implementation — audit only |

This document answers: what blueprint-like objects exist, which are SSOT, which are legacy, what overlaps with Commercial Genome Beta, and whether a **new** Commercial Blueprint is needed.

**Method:** Static analysis of types, creators, consumers, and `generate-infographic-handler.ts` production path. No assumptions beyond code evidence.

---

## Executive Summary

| Finding | Detail |
|---------|--------|
| **Blueprint layer is already implemented** | Under names: `FinalDesignBlueprint`, `SceneBlueprint` (v1), `LayoutSpec`, `ScenePlan`, `VisualSceneBlueprint` |
| **v18 `RenderBlueprint` exists but is UNUSED in production** | 400+ files in `render-blueprint/`; zero imports from handler |
| **No `SceneGraph` runtime module** | Only flag category + architecture docs |
| **No `GenerationContext` runtime on main/beta branch** | Only Feature Flag Registry metadata |
| **`???????????????` in pipeline** | Not a missing object — it is **decomposed**: Governance Blueprint + Director outputs + Visual Pipeline |
| **Commercial Genome Beta** | Parallel commercial decision layer; **not wired** into layout SSOT (`productAreaTarget` orphan) |
| **Recommendation** | **Variant A** — extend existing blueprint stack; **do not** create new Commercial Blueprint |

---

## Production Pipeline Map (code-evidenced)

```text
Generation Request
        │
        ▼
ProductAnalysis + DesignBrief + GenomeIntelligence (legacy agents)
        │
        ▼
runVisualStoryDirector → VisualStoryDirectorResult
        │
        ▼
runSceneDirector → SceneBlueprint v1
        │
        ▼
runCompositionDirector → LayoutSpec (+ LayoutGeometry)
        │
        ▼
planScene → ScenePlan
        │
        ├─ (if DESIGN_GOVERNANCE) resolveDesignDecisions → FinalDesignBlueprint [SSOT locked]
        │
        ├─ (if DAOS_COMMERCIAL_GENOME_BETA=1) createCommercialGenomeBetaDecision → CommercialDecisionBeta
        │       └─ snippet only → genomeSnippet (v16 path) / diagnostics (both paths)
        │
        ▼
buildLayoutWithAgentReview → CompositionLayout (productAreaPct computed here)
        │
        ├─ (if RENDER_ENGINE_V17=1) rebuildVisualPipelineForRender → VisualSceneBlueprint
        │       └─ regenerateMarketplaceBackground → PollinationsCompiler → Flux
        │
        └─ (if !v17) compileBackgroundPrompt → ScenePromptContext → Prompt Compiler → Flux
```

**What is `???????????????`?**

It is **not one missing blueprint**. It is the **Director + Governance assembly**:

| Layer | Object | Role |
|-------|--------|------|
| Story | `VisualStoryDirectorResult` | Hero concept, customer intent, narrative |
| Scene | `SceneBlueprint` v1 | Environment, lighting, camera, hero placement |
| Layout | `LayoutSpec` | Geometry, hierarchy, heroScale, whitespace |
| Runtime scene | `ScenePlan` | Camera/lighting/background strings for compositor |
| Governance lock | `FinalDesignBlueprint` | Merged SSOT when governance on |
| Render (v17) | `VisualSceneBlueprint` | Structured decisions for Pollinations |
| Commercial (beta) | `CommercialDecisionBeta` | EKB rules → decision (parallel, thin wire) |

---

## Blueprint Entity Catalog

For each entity: 10 audit fields per council template.

---

### 1. FinalDesignBlueprint

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `FinalDesignBlueprint` |
| 2 | **Path** | `marketplace-infographic/src/lib/design-governance/blueprint/types.ts` |
| 3 | **Purpose** | Single **locked authoritative design state** for governance render path — scene, environment, lighting, composition, layout, palette, narrative + embedded blueprints |
| 4 | **Creator** | `resolveDesignDecisions()` — `design-governance/resolver/resolver.ts`; hardened by `runMandatoryConstitution()` |
| 5 | **Readers** | `generate-infographic-handler.ts`, `assertRenderAllowed()`, `buildDecisionTrace()`, `buildGovernanceScorecard()`, constitution gate |
| 6 | **Status** | **ACTIVE** when `USE_DESIGN_GOVERNANCE && layout=marketplace` (default with v17) |
| 7 | **SSOT** | **Yes** — for governed marketplace runs. Comment in code: *"read-only for downstream modules"* |
| 8 | **Data** | Scene, environment, lighting, style, composition, layout strings; `sceneBlueprint`, `layoutSpec`, `scenePlan`; conflicts, resolved decisions, confidence |
| 9 | **Overlap with Genome Beta** | Both express environment/lighting/composition intent. Genome Beta has `environmentDirection`, `backgroundContrastDirection`, `visualHierarchy`; FinalDesignBlueprint has string summaries + embedded `LayoutSpec.heroScale` (not `productAreaTarget` from beta) |
| 10 | **Gaps** | No EKB rule trace; no `antiRules`; no explicit `mainMessage` commercial framing; does not consume `CommercialDecisionBeta` |

---

### 2. SceneBlueprint (v1 — Production)

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `SceneBlueprint` |
| 2 | **Path** | `marketplace-infographic/src/lib/design/scene-blueprint/types.ts` |
| 3 | **Purpose** | Structured visual scene — environment type, lighting preset, camera, hero block, materials, accents |
| 4 | **Creator** | `runSceneDirector()` → `buildSceneDirectorBlueprint()` — `SceneDirector.ts`; `buildBlueprintFromTemplate()` — `templates.ts`; `visualBlueprintToSceneBlueprint()` — `visual-pipeline/assemble.ts` |
| 5 | **Readers** | Handler, `planScene`, governance resolver, prompt-compiler, render-engine planner, design-constitution validators |
| 6 | **Status** | **ACTIVE** |
| 7 | **SSOT** | **Yes** for scene structure (v16 director path). Subsumed by `FinalDesignBlueprint.sceneBlueprint` when governance on |
| 8 | **Data** | Scene type, lighting, camera, hero position/scale/anchor, headline zone, accents, materials, depth |
| 9 | **Overlap with Genome Beta** | `SceneHero` vs `heroDominance=product_first`; environment rules in beta map to `sceneType` / lighting here — **no runtime link** |
| 10 | **Gaps** | No commercial rule IDs; no anti-rule enforcement; hero scale not tied to EKB `productAreaTarget=0.55` |

**Naming collision:** `SceneBlueprint` in `render-blueprint/types.ts:117` (v18) is a **different type** — environment enum only.

---

### 3. LayoutSpec

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `LayoutSpec` |
| 2 | **Path** | `marketplace-infographic/src/lib/design/layout-spec/types.ts` |
| 3 | **Purpose** | Layout contract — hero position, hero scale %, hierarchy map, whitespace, badges/icons limits, palette, background/lighting style |
| 4 | **Creator** | `buildInitialLayoutSpec()` — `builder.ts`; `runCompositionDirector()` → `geometryToLegacySpec()`; governance resolver sync |
| 5 | **Readers** | Handler, layout engine, agents (SAD/CTR patches), prompt-compiler, visual-pipeline directors, quality-v165, render-engine |
| 6 | **Status** | **ACTIVE** |
| 7 | **SSOT** | **Yes** for layout geometry + commercial layout parameters (`heroScale`, `hierarchy`, `maxIcons`) |
| 8 | **Data** | `heroPosition`, `heroScale` (55–75 target), `hierarchy`, `visualWeightMap`, `geometry`, `whitespaceTarget`, `maxIcons`, `maxSecondaryObjects`, palette, background/lighting style |
| 9 | **Overlap with Genome Beta** | **High.** `heroScale` ≈ `productAreaTarget`; `hierarchy` ≈ `visualHierarchy`; `maxIcons`/`maxSecondaryObjects` ≈ `badgeLimit` — **values not synchronized** |
| 10 | **Gaps** | No `antiRules`; no commercial rule provenance; `heroScale` set by composition director, not Genome Beta decision |

---

### 4. VisualSceneBlueprint (v2)

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `VisualSceneBlueprint` |
| 2 | **Path** | `marketplace-infographic/src/lib/design/visual-pipeline/types.ts` |
| 3 | **Purpose** | Unified structured blueprint for **v17 render path** — story, environment, lighting, camera, materials, composition safe zones; **no NL prompt fragments** |
| 4 | **Creator** | `assembleVisualSceneBlueprint()` — `assemble.ts`; `rebuildVisualPipelineForRender()` — `rebuild-for-render.ts` |
| 5 | **Readers** | `regenerateMarketplaceBackground()`, `render-planner.ts`, `pollinations-compiler.ts`, render debug |
| 6 | **Status** | **ACTIVE** when `RENDER_ENGINE_V17=1` |
| 7 | **SSOT** | **Yes** for Pollinations/Flux render input (v17) |
| 8 | **Data** | Story, scene environment, lighting, camera, materials, mood, palette, composition (heroPosition, safeZones, visualWeight) |
| 9 | **Overlap with Genome Beta** | `composition.visualWeight.hero` vs `heroDominance`; environment architecture vs `environmentDirection` — parallel semantics, **no import from Genome Beta** |
| 10 | **Gaps** | Genome Beta snippet not passed to `rebuildVisualPipelineForRender()`; no `antiRules` in blueprint; no `maxCharacteristics` |

---

### 5. ScenePlan

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `ScenePlan` |
| 2 | **Path** | `marketplace-infographic/src/lib/design/scene-planner.ts` |
| 3 | **Purpose** | Runtime scene graph–like plan — camera/lighting/background strings, safe zones, product safe zone, composition scenario |
| 4 | **Creator** | `planScene()`; `applyBlueprintToScenePlan()` from SceneBlueprint |
| 5 | **Readers** | Handler, prompt-compiler, compositor, quality validators, render-engine |
| 6 | **Status** | **ACTIVE** |
| 7 | **SSOT** | **Yes** for compositor/runtime scene execution (not for commercial rules) |
| 8 | **Data** | Camera, lighting, background, safe zones, product safe zone, surface, reflection, shadow, cover concept |
| 9 | **Overlap with Genome Beta** | Low direct overlap — execution layer |
| 10 | **Gaps** | No commercial decision fields; patches from SceneBlueprint only |

---

### 6. RenderBlueprint (v18 — Dormant)

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `RenderBlueprint` |
| 2 | **Path** | `marketplace-infographic/src/lib/render-blueprint/types.ts` (+ 400 files) |
| 3 | **Purpose** | Full v18 blueprint — Meta, Creative, Story, Product, Scene, Photography, Camera, Lighting, Material, Composition, Background, Constraints, Validation sections |
| 4 | **Creator** | `createEmptyRenderBlueprint()`, `renderBlueprintFromVisualPipeline()` — `from-visual-blueprint.ts`; 30+ agent engines |
| 5 | **Readers** | **Internal only** — v18 specs, design-ai-book registry. **Zero production handler imports** |
| 6 | **Status** | **UNUSED** in production (`RENDER_BLUEPRINT_V18=1` sets version string only) |
| 7 | **SSOT** | **No** — aspirational v18 SSOT; production uses v16/v17 stack |
| 8 | **Data** | All render domains including commercial story, photography, camera, lighting, composition, validation |
| 9 | **Overlap with Genome Beta** | v18 `CommercialBusinessModelContext` in `pipeline-context-types.ts` overlaps commercial intent — separate from Genome Beta, also unused in production |
| 10 | **Gaps** | Not connected to handler; duplicate of v1/v2 production types under different schema |

---

### 7. GenerationPipelineContext (v18)

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `GenerationPipelineContext` |
| 2 | **Path** | `marketplace-infographic/src/lib/render-blueprint/pipeline-context-types.ts` |
| 3 | **Purpose** | v18 unified context — business, knowledge, creative, technical, render, validation sections |
| 4 | **Creator** | `createGenerationPipelineContext()` — `pipeline-context-engine.ts` |
| 5 | **Readers** | v18 stage engines + specs only |
| 6 | **Status** | **UNUSED** in production |
| 7 | **SSOT** | **No** — parallel to future `GenerationContext` (Wave 36, not on this branch) |
| 8 | **Data** | Product, marketplace, brand, `CommercialBusinessModelContext`, knowledge package, creative, render section |
| 9 | **Overlap with Genome Beta** | `CommercialBusinessModelContext` vs `CommercialDecisionBeta` — same domain, different schemas, no bridge |
| 10 | **Gaps** | Not in handler; duplicates Foundation `GenerationContext` intent from roadmap |

---

### 8. ScenePromptContext / PromptCompilerInput (v16 path)

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `ScenePromptContext`, `PromptCompilerInput` |
| 2 | **Path** | `design/prompt-builder.ts`, `design/prompt-compiler/types.ts` |
| 3 | **Purpose** | Compile background prompt from scene plan + analysis + snippets |
| 4 | **Creator** | `compileBackgroundPrompt()` in handler → `compileSceneRenderingPrompt()` |
| 5 | **Readers** | Legacy background path (`!useRenderEngineV17`) |
| 6 | **Status** | **PARTIAL** — active only when v17 off |
| 7 | **SSOT** | **Yes** for v16 prompt text output |
| 8 | **Data** | Scene plan refs, market/genome snippets, layout spec, story hero concept |
| 9 | **Overlap with Genome Beta** | `commercialGenomeBetaSnippet` appended to `genomeSnippet` — **only v16 path** |
| 10 | **Gaps** | Bypassed when v17 on; no structured commercial fields in `ScenePromptContext` type |

---

### 9. CommercialDecisionBeta / CommercialGenomeBeta

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `CommercialDecisionBeta`, `CommercialGenomeBetaDecisionResult` |
| 2 | **Path** | `marketplace-infographic/src/lib/daos/commercial-genome-beta/` |
| 3 | **Purpose** | EKB v1.0 rules → KRE Beta selection → commercial decision for WB Hero |
| 4 | **Creator** | `createCommercialGenomeBetaDecision()` |
| 5 | **Readers** | Handler (flag-gated), diagnostic report, `payloadExtras.commercialGenomeBeta` |
| 6 | **Status** | **PARTIAL** — ACTIVE when `DAOS_COMMERCIAL_GENOME_BETA=1`; thin integration |
| 7 | **SSOT** | **Yes** for commercial **rules/decisions** (beta scope only) |
| 8 | **Data** | mainMessage, heroDominance, productAreaTarget, maxCharacteristics, badgeLimit, environmentDirection, backgroundContrastDirection, typographyDirection, visualHierarchy, antiRules, selectedRules |
| 9 | **Overlap** | Overlaps `LayoutSpec`, `VisualSceneBlueprint.composition`, `CardMeaning` — **not merged** |
| 10 | **Gaps** | Not consumed by LayoutSpec/VisualSceneBlueprint/v17 render; `mainMessage` is template string; no layout enforcement |

---

### 10. VisualStoryDirectorResult

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `VisualStoryDirectorResult` |
| 2 | **Path** | `agents/visual-story-director/types.ts` (production); duplicate agent in `render-blueprint/visual-story-director-agent-*` (v18) |
| 3 | **Purpose** | Story blueprint — hero concept, customer intent, visual hook, scene narrative, composition scenario |
| 4 | **Creator** | `runVisualStoryDirector()` — production agents |
| 5 | **Readers** | Handler, scene director, scene planner, prompt snippets |
| 6 | **Status** | **ACTIVE** |
| 7 | **SSOT** | **Yes** for story/narrative layer (pre-scene) |
| 8 | **Data** | heroConcept, customerIntent, visualHook, sceneNarrative, compositionScenarioId |
| 9 | **Overlap with Genome Beta** | Both address "what Hero sells" — Genome Beta `mainMessage` vs `heroConcept` — **independent** |
| 10 | **Gaps** | No EKB rule binding; no anti-rules |

---

### 11. CompositionDirectorResult

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `CompositionDirectorResult` |
| 2 | **Path** | `design/composition-director/types.ts` |
| 3 | **Purpose** | Layout geometry + template selection from scene + genome |
| 4 | **Creator** | `runCompositionDirector()` |
| 5 | **Readers** | Handler, governance resolver, constitution |
| 6 | **Status** | **ACTIVE** |
| 7 | **SSOT** | **Partial** — produces `LayoutSpec` which becomes SSOT |
| 8 | **Data** | `LayoutGeometry`, templateId, visual weights, quality scores |
| 9 | **Overlap with Genome Beta** | Geometry drives `productAreaPct` — not fed from `productAreaTarget` |
| 10 | **Gaps** | No commercial rule input |

---

### 12. CardMeaning

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `CardMeaning` |
| 2 | **Path** | `layout-engine/types.ts` |
| 3 | **Purpose** | Commercial copy meaning — title, subtitle, feature, badge, emotion (no coordinates) |
| 4 | **Creator** | `creativeConceptToCardMeaning()`, `normalizeCardMeaning()` in handler |
| 5 | **Readers** | Layout engine, quality gate, agents, HTML template render |
| 6 | **Status** | **ACTIVE** |
| 7 | **SSOT** | **Yes** for on-card text semantics |
| 8 | **Data** | title, subtitle, feature, badge, emotion, style, priority |
| 9 | **Overlap with Genome Beta** | `maxCharacteristics`, `badgeLimit`, `mainMessage` should constrain CardMeaning — **not wired** |
| 10 | **Gaps** | No Genome Beta consumption; no grammar/result-orientation enforcement from EKB |

---

### 13. DecisionGraph (render-blueprint v18)

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `DecisionGraph` |
| 2 | **Path** | `render-blueprint/decision-graph.ts` |
| 3 | **Purpose** | v18 blueprint mutation graph, rollback, validation snapshots |
| 4 | **Creator** | `DecisionGraph.fromBlueprint()` |
| 5 | **Readers** | v18 snapshot-manager, specs only |
| 6 | **Status** | **UNUSED** in production |
| 7 | **SSOT** | **No** |
| 8 | **Data** | Blueprint section nodes, edges, validation state |
| 9 | **Overlap** | Architecture name collision with future DAOS DecisionGraph — different module |
| 10 | **Gaps** | Not connected to Genome Beta or governance |

---

### 14. DesignBrief

| # | Field | Value |
|---|-------|-------|
| 1 | **Name** | `DesignBrief` |
| 2 | **Path** | `design-brief/schema.ts` |
| 3 | **Purpose** | User/process design intent — hooks, background prompt, card meaning, composition |
| 4 | **Creator** | Ollama/SD generation, user input |
| 5 | **Readers** | Handler throughout pipeline |
| 6 | **Status** | **ACTIVE** |
| 7 | **SSOT** | **Partial** — input boundary, not computed SSOT |
| 8 | **Data** | visualHook, backgroundPrompt, cardMeaning, designProcess fields |
| 9 | **Overlap** | Informal commercial intent predating Genome Beta |
| 10 | **Gaps** | Not rule-governed; duplicates some Genome Beta concerns |

---

## Status Matrix

| Object | ACTIVE | PARTIAL | LEGACY | UNUSED |
|--------|--------|---------|--------|--------|
| FinalDesignBlueprint | ✓ (governance) | | | |
| SceneBlueprint v1 | ✓ | | | |
| LayoutSpec | ✓ | | | |
| VisualSceneBlueprint | ✓ (v17) | | | |
| ScenePlan | ✓ | | | |
| ScenePromptContext | | ✓ (v16 only) | | |
| CommercialDecisionBeta | | ✓ (flag + thin wire) | | |
| VisualStoryDirectorResult | ✓ | | | |
| CardMeaning | ✓ | | | |
| CompositionDirectorResult | ✓ | | | |
| DesignBrief | ✓ | | | |
| RenderBlueprint v18 | | | | ✓ |
| GenerationPipelineContext v18 | | | | ✓ |
| DecisionGraph v18 | | | | ✓ |
| SceneGraph (runtime) | | | | ✓ (not implemented) |
| GenerationContext (DAOS) | | | | ✓ (not on branch) |

---

## Field Traceability Map

Fields requested by council — where they live in code today:

| Concept | Canonical field(s) | Owner module | Wired to Genome Beta? |
|---------|-------------------|--------------|----------------------|
| **productAreaTarget** | `CommercialDecisionBeta.productAreaTarget` (0.55) | commercial-genome-beta | Declared only — **not consumed** by layout |
| | `LayoutSpec.heroScale` (55–75) | layout-spec | Independent |
| | `CompositionLayout.metrics.productAreaPct` | layout-engine / design/build | **Computed** — actual metric |
| **hero** | `SceneBlueprint.hero`, `LayoutSpec.hierarchy.hero`, `VisualSceneBlueprint.composition.visualWeight.hero` | scene-blueprint, layout-spec, visual-pipeline | No |
| | `CommercialDecisionBeta.heroDominance` | commercial-genome-beta | Declared only |
| **layout** | `LayoutSpec`, `CompositionLayout`, `FinalDesignBlueprint.layout` | layout-spec, layout-engine, governance | No |
| **typography** | `CardMeaning.title/subtitle/feature`, prompt-compiler sections | layout-engine, prompt-compiler | No |
| | `CommercialDecisionBeta.typographyDirection` | commercial-genome-beta | Snippet only |
| **environment** | `SceneBlueprint.sceneType`, `VisualSceneBlueprint.scene`, `FinalDesignBlueprint.environment` | scene-blueprint, visual-pipeline | No |
| | `CommercialDecisionBeta.environmentDirection` | commercial-genome-beta | Snippet only |
| **camera** | `SceneBlueprint.camera`, `VisualSceneBlueprint.camera`, `ScenePlan.camera*` | scene-blueprint, visual-pipeline, scene-planner | No |
| **lighting** | `SceneBlueprint.lighting`, `VisualSceneBlueprint.lighting`, `LayoutSpec.lightingStyle` | multiple | No |
| **badges** | `CardMeaning.badge`, `LayoutSpec.maxIcons`, sdData.badgeId | layout-engine, layout-spec | No |
| | `CommercialDecisionBeta.badgeLimit` (2) | commercial-genome-beta | Not enforced |
| **hierarchy** | `LayoutSpec.hierarchy`, `LayoutSpec.visualWeightMap` | layout-spec | No |
| | `CommercialDecisionBeta.visualHierarchy[]` | commercial-genome-beta | Snippet only |
| **commercial decision** | `CommercialDecisionBeta` | commercial-genome-beta | Self |
| | `FinalDesignBlueprint.resolvedDecisions` | design-governance | Separate decision model |
| | `CommercialBusinessModelContext` | render-blueprint v18 | Unused |

**Key finding:** `productAreaPct` is **actively computed** in layout engine (`design/build.ts`, agents heuristics target 55–75%). `productAreaTarget` from Genome Beta is **orphan metadata**.

---

## Duplications and Overlaps

| Domain | Duplicate implementations | Risk |
|--------|--------------------------|------|
| Scene blueprint | SceneBlueprint v1 (production) vs SceneBlueprint v18 (render-blueprint) | Name collision, confusion |
| Story director | `agents/visual-story-director` (production) vs `render-blueprint/visual-story-director-agent` (v18) | Parallel ecosystems |
| Commercial intent | DesignBrief + CardMeaning + VisualStoryDirector + Genome Beta + v18 CommercialBusinessModelContext | No single owner |
| Layout hero % | LayoutSpec.heroScale + productAreaPct metrics + Genome Beta productAreaTarget | Three sources, not synced |
| Pipeline context | GenerationPipelineContext v18 vs future GenerationContext vs handler locals | Fragmented |
| Decision graph | render-blueprint DecisionGraph vs architecture DecisionGraph | Name collision |
| Environment | SceneBlueprint.sceneType + VisualSceneBlueprint.scene + Genome environmentDirection | Parallel, unlinked |

---

## Missing Functionality (genuine gaps)

These are **not** solved by creating a new blueprint file — they are **integration gaps**:

| Gap | Evidence |
|-----|----------|
| Genome Beta → LayoutSpec bridge | `heroScale` not set from `productAreaTarget` |
| Genome Beta → VisualSceneBlueprint bridge | `rebuildVisualPipelineForRender()` has no commercial input |
| Genome Beta → v17 prompt path | Snippet only in `compileBackgroundPrompt` (v16); v17 bypasses |
| Genome Beta → CardMeaning | `maxCharacteristics`, `badgeLimit`, `mainMessage` not applied |
| Commercial anti-rules enforcement | Anti-rules in diagnostics only, not in constitution/gate |
| Unified commercial trace | EKB rule IDs not in FinalDesignBlueprint or governance trace |
| GenerationContext on branch | Module absent — only flags reference it |
| SceneGraph runtime | Not implemented — ScenePlan is de facto scene representation |

---

## SSOT Summary

| Domain | Production SSOT | Notes |
|--------|-----------------|-------|
| Governed design state | `FinalDesignBlueprint` | When governance on |
| Scene structure | `SceneBlueprint` v1 | Embedded in governance blueprint |
| Layout geometry | `LayoutSpec` | heroScale, hierarchy, geometry |
| Runtime compositing | `ScenePlan` | |
| v17 render input | `VisualSceneBlueprint` | → PollinationsCompiler |
| v16 prompt | `ScenePromptContext` / compiled prompt | Legacy path |
| On-card copy | `CardMeaning` | |
| Commercial rules (beta) | `CommercialDecisionBeta` | Flag-gated, parallel |
| Full v18 blueprint | None in production | RenderBlueprint unused |

---

## Recommendation

### Variant A: Extend existing Blueprint stack — **RECOMMENDED**

**Do not create a new Commercial Blueprint type.**

Evidence:

1. **Production already has a decomposed blueprint stack** that covers scene, layout, story, render, and governance — all ACTIVE in handler.
2. **`RenderBlueprint` v18 already models commercial + render domains** but is unused — creating another parallel "Commercial Blueprint" would add a **fourth** duplicate (after v18, FinalDesignBlueprint, Genome Beta).
3. **Commercial Genome Beta is the correct commercial SSOT** for rules/decisions — it needs **bridges**, not a new container.
4. **`FinalDesignBlueprint` is the correct merge point** for governance path — extend with optional `commercialDecision?: CommercialDecisionBeta`.
5. **`LayoutSpec` and `VisualSceneBlueprint` are the correct execution targets** for `productAreaTarget`, `environmentDirection`, `visualHierarchy`.

**Concrete extension plan (architecture only — not implementation):**

| Step | Action |
|------|--------|
| A1 | Add `commercialDecision` ref to `FinalDesignBlueprint` (optional, flag-gated) |
| A2 | Map `CommercialDecisionBeta` → `LayoutSpec` patches (`heroScale`, `maxIcons`, hierarchy) |
| A3 | Map `CommercialDecisionBeta` → `VisualSceneBlueprint` / Pollinations compiler input |
| A4 | Pass Genome snippet into v17 `regenerateMarketplaceBackground` path |
| A5 | Deprecate v18 `RenderBlueprint` as production candidate until handler adoption plan exists — do not fork commercial model again |
| A6 | Rename collision docs: v18 `SceneBlueprint` vs v1 `SceneBlueprint` in ADL |

### Variant B: Create new Commercial Blueprint — **NOT RECOMMENDED**

Would duplicate:

- `CommercialDecisionBeta` (already exists)
- `CommercialBusinessModelContext` (v18, unused)
- `FinalDesignBlueprint` commercial strings
- `CardMeaning` copy layer

**Risk:** Fourth parallel schema, increased entropy, violates Beta-first "no duplicate architecture" rule.

---

## Answer to Main Question

> Нужно ли создавать новый Commercial Blueprint?

**Нет.** На основе кода: commercial blueprint functionality **уже распределена** между `CommercialGenomeBeta` (rules/decisions), `FinalDesignBlueprint` (governance lock), `LayoutSpec` + `CardMeaning` (layout/copy), `VisualSceneBlueprint` (render). 

> Достаточно ли расширить Render Blueprint / Layout Blueprint?

**Частично:**

- **Расширять `RenderBlueprint` v18** — только если принять решение о миграции handler на v18 (сейчас UNUSED). Иначе — мёртвый код.
- **Расширять `LayoutSpec` + governance `FinalDesignBlueprint` + v17 `VisualSceneBlueprint`** — **да**, это production path.
- **Связать `CommercialGenomeBeta`** — **да**, это недостающий мост, а не новый blueprint.

---

## Appendix: Handler Import Evidence

Production handler (`generate-infographic-handler.ts`) imports:

| Module | Imported |
|--------|----------|
| `design/scene-blueprint` | ✓ |
| `design/layout-spec` | ✓ (via composition) |
| `design/visual-pipeline` | ✓ |
| `design-governance` | ✓ |
| `design/scene-planner` | ✓ |
| `daos/commercial-genome-beta` | ✓ (beta branch) |
| `render-engine` | ✓ |
| `render-blueprint` | **✗ zero imports** |

---

**END OF DAOS BLUEPRINT LAYER AUDIT**
