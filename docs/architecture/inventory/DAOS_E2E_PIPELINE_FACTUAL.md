# DAOS E2E Pipeline — Factual Trace

**Checkout:** `main` (and this inventory branch)  
**Live entry:** `POST /api/generate-infographic` → `handleGenerateInfographic`  
**Primary file:** `marketplace-infographic/src/lib/generate-infographic-handler.ts`  
**Version label:** `marketplace-infographic/src/lib/pipeline-version.ts`

This is the **actual** production path. It is **not** the Architecture Bible Runtime model, **not** `runDesignAiBookPipeline`, and **not** the unmerged `src/lib/daos` kernel.

---

## Version labels (what the string means)

| Env | `PIPELINE_VERSION` |
|-----|--------------------|
| `RENDER_BLUEPRINT_V18=1` | `v18.0-render-blueprint` (**label only** — does not run book/blueprint pipeline) |
| Governance on (`DESIGN_GOVERNANCE_V171=1` or auto with v17) | `v17.1-design-governance` |
| `RENDER_ENGINE_V17=1` / `PIPELINE_V17=1` without governance | `v17.0-render-engine` |
| else | `v16.9-design-constitution` |

---

## Stage sequence (marketplace layout)

```text
API auth + schema
  → loadDesignLibrary + selectRelevantExamples
  → handleGenerateInfographic
       → consumeGenerationSlot
       → loadDesignMemoryStore
       → preloadKnowledgeAnalysis
       → [parallel] retrieveKnowledgeContext
                    retrieveMarketIntelligence
                    retrieveAssetsIntelligence
                    retrieveTrendIntelligence
       → retrieveGenomeIntelligence
       → [parallel] generateSdInfographicData (Ollama)
                    analyzeProductVisual
                    cutout
       → runVisualStoryDirector          [marketplace + genome]
       → runSceneDirector                [marketplace]
       → runCompositionDirector          [marketplace]
       → planScene
       → [GOVERNANCE?] resolveDesignDecisions + runMandatoryConstitution
       → runCommercialPhotoDirector      [marketplace + genome + story]
       → buildLayoutWithAgentReview:
            computeProfessionalLayout
            runSeniorArtDirector ∥ runMarketplaceCtrExpert ∥ runArtDirector
            quality gate / constitution refine loops
       → [V17?] rebuildVisualPipelineForRender
       → [GOVERNANCE?] assertRenderAllowed (pre-background)
       → regenerateMarketplaceBackground
            → [V17] renderWithRetry (NOT runRenderEngine)
            → [else] Stable Diffusion / HF
       → [photoreal] compositeProductIntoScene + runCommercialPhotographer
       → runChiefDesignDirector (+ optional fix retries)
       → concept render retries / evaluateFinalQuality
       → [GOVERNANCE?] scorecard + assertRenderAllowed + render report
       → renderInfographicHtml → Puppeteer PNG → polishCoverImage
       → learning side-effects (memory / assets / patterns / genome)
       → prisma.generatedImage create/update
       → JSON response + pipelineVersion
```

---

## Key file map

| Concern | Path |
|---------|------|
| API | `marketplace-infographic/src/app/api/generate-infographic/route.ts` |
| Regen API | `.../api/regenerate-background/route.ts` |
| Handler | `.../src/lib/generate-infographic-handler.ts` |
| Pipeline version | `.../src/lib/pipeline-version.ts` |
| Pipeline knobs | `.../src/lib/pipeline-config.ts` |
| Render bg | `.../src/lib/render-engine/regenerate-background.ts` |
| Governance | `.../src/lib/design-governance/` |
| Agents | `.../src/lib/agents/` |
| Design intel | `.../src/lib/design/` |
| Compositor | `.../src/lib/compositing/scene-compositor.ts` |
| DB | `marketplace-infographic/prisma/schema.prisma` → `GeneratedImage` |

---

## Explicitly NOT called from live handler

| Module | Exists on `main`? | Called? |
|--------|-------------------|---------|
| `runDesignAiBookPipeline` | YES — `design-ai-book/pipeline.ts` | **NO** (specs only) |
| `render-blueprint` engines | YES | **NO** imports in handler |
| `runRenderEngine` | YES — exported | **NO** (live uses `renderWithRetry`) |
| `src/lib/daos/*` | **NO on main** | N/A |

---

## Documented parallel narratives (not live)

| Narrative | Source | Relation to live path |
|-----------|--------|----------------------|
| AUDIT.md parallel intel → genome → directors → render | `AUDIT.md` | Closest to live; omits governance/v17 details |
| Bible Stage 1–14 Platform chain | `Architecture_Bible.md` Part 3 | Spec target; not how handler is structured |
| Book Ch8→11 | `design-ai-book/pipeline.ts` | Separate executable for tests |
| L2 DAOS kernel / genome beta | feature branches | Unmerged |

---

## Artifacts

| Artifact | Location |
|----------|----------|
| Final PNG | `public/generated/{userId}-{ts}.png` → `/api/generated/...` |
| Cutout | `/uploads/cutouts/...` |
| Background | `/backgrounds/...` or provider URL |
| Merged scene | `/merged/...` (when photoreal) |
| DB | Prisma `GeneratedImage` (+ packed `generatedJson`) |

---

**END OF E2E FACTUAL TRACE**
