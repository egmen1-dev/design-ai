# DAOS Entity Catalog

**Scope:** Factual status matrix. No redesign.  
**Legend:**

| Status | Meaning |
|--------|---------|
| IMPLEMENTED | Code exists on `main` |
| PARTIAL | Code exists; incomplete or not prod-wired |
| DOCS-ONLY | Documented; no (or placeholder) code on `main` |
| DEPRECATED | Explicitly archived / superseded |
| FEATURE-BRANCH | Exists on remote feature tip; **not on `main`** |
| NOT FOUND | Name absent in searched corpus |
| UNKNOWN | Insufficient evidence |

---

## A. Meta / volumes

| Entity | Aliases | Status | Evidence |
|--------|---------|--------|----------|
| Design AI Operating System | Design AI OS, Design AI | DOCS + PARTIAL code | `docs/Architecture_Bible.md`; app code under `marketplace-infographic/src/lib/` |
| DAOS (acronym as product brand) | Design AI OS | FEATURE-BRANCH / Alias | L2 `docs/DAOS_Specification.md`; `src/lib/daos/` on constitution tip; **absent** as code namespace on `main` |
| Architecture Bible Volume I | — | DOCS (Complete claim) | `docs/Architecture_Bible.md` Appendix D |
| Code Rewrite Bible Volume II | — | DOCS-ONLY | `docs/Code_Rewrite_Bible.md` |
| Architecture DSL | architecture.yaml | DOCS | `docs/architecture/architecture.yaml` |
| MarketplaceOS | — | NOT FOUND | `git grep` empty |
| AI Commerce Core | — | NOT FOUND | `git grep` empty |

---

## B. Target Bible platforms / infra

| Entity | Status | Evidence |
|--------|--------|----------|
| Runtime / RuntimeV2 / Runtime Engine | DOCS-ONLY (+ IRuntime interface PARTIAL) | YAML `RuntimeV2`; `platform-core/interfaces/IRuntime.ts`; no `src/lib/runtime/` |
| Platform Core | PARTIAL | `src/lib/platform-core/` |
| Architecture Registry | PARTIAL | `platform-core/registry/` |
| Platform Registry | PARTIAL | same |
| Provider Registry | PARTIAL (render providers separate) | `platform-core` + `render-engine/providers/registry.ts` |
| Plugin / Skill Registry | UNKNOWN / DOCS | Bible Part 10; SDK-001 often blocked |
| ProjectState | PARTIAL | `platform-core/project-state/`; not full LAW-004 pipeline SSOT |
| Research Platform | DOCS-ONLY | Bible Part 3–4 |
| Knowledge Platform (Bible) | PARTIAL (as functions) | `design/` retrieval APIs; not Bible Platform folder |
| Commercial Platform (Bible) | PARTIAL / DOCS | Book Ch11 module exists; Bible platform as named layer missing |
| Creative Intelligence Platform | PARTIAL | `design-process/`; Bible migration label |
| Visual Intelligence Platform | PARTIAL | `design/visual-pipeline/` when used |
| Design Governance | IMPLEMENTED (gated) | `design-governance/` |
| Rendering / Render Engine | IMPLEMENTED (gated) | `render-engine/` |
| Vision Platform | DOCS-ONLY | Bible Stage 13 |
| Learning Platform | PARTIAL | Design Memory / genome / feedback functions; not Platform folder |
| Asset Platform | DOCS-ONLY | RFC-006 |
| AI CEO Platform | DOCS-ONLY | Bible Part 9 |
| Platform SDK | DOCS-ONLY | Bible Part 10 |
| Reasoning / Consensus Engine | DOCS / PARTIAL (v18 engines) | Bible Part 7; some engines under `render-blueprint/` |
| Decision Graph / RenderGraph / Execution Graph | DOCS / FEATURE-BRANCH pieces | ADR-004; L2 commercial-decision-beta |
| Overlay Engine / OverlayBlueprint | DOCS / FEATURE-BRANCH | Bible; L2 `daos/overlay/` |
| Cost / Confidence / Feedback Engines | PARTIAL / DOCS | scattered |

---

## C. Production marketplace pipeline entities (`main`)

| Entity | Status | Wired | Evidence |
|--------|--------|-------|----------|
| `handleGenerateInfographic` | IMPLEMENTED | YES | `generate-infographic-handler.ts` |
| Knowledge Engine (prod) | IMPLEMENTED | YES | `design/` + AUDIT.md |
| Market Intelligence | IMPLEMENTED | YES | `design/` |
| Assets Intelligence | IMPLEMENTED | YES | `design/` |
| Trend Intelligence | IMPLEMENTED | YES | `design/` |
| Design Genome (prod) | IMPLEMENTED | YES | `design/` + Prisma `DesignGenome` |
| Visual Story Director | IMPLEMENTED | YES | `agents/visual-story-director` |
| Scene Planner | IMPLEMENTED | YES | `design/scene-planner` |
| Scene Director | IMPLEMENTED | YES | `design/` + agents |
| Composition Director | IMPLEMENTED | YES | `design/` + agents |
| Commercial Photo Director | IMPLEMENTED | YES | `agents/` |
| Layout Engine | IMPLEMENTED | YES | `layout-engine/` |
| Senior Art Director | IMPLEMENTED | YES | `agents/` |
| Art Director | IMPLEMENTED | YES | `agents/` |
| Marketplace CTR Expert | IMPLEMENTED | YES | `agents/` |
| Commercial Photographer | IMPLEMENTED | YES | `agents/` |
| Chief Design Director | IMPLEMENTED | YES | `agents/` |
| Design Memory | IMPLEMENTED | YES | `agents/design-memory` |
| Scene compositor | IMPLEMENTED | YES | `compositing/scene-compositor.ts` |
| Canvas Composer | IMPLEMENTED | PARTIAL path | `render-engine/composer/`; live BG uses `renderWithRetry` |
| Puppeteer HTML→PNG | IMPLEMENTED | YES | `puppeteer` / render helpers |

---

## D. Design AI Book / v18 (`main` code, not live-wired)

| Entity | Status | Wired to handler | Evidence |
|--------|--------|------------------|----------|
| Render Blueprint engines (Ch3) | IMPLEMENTED | NO | `render-blueprint/` |
| Agent Ecosystem (Ch4) | IMPLEMENTED | NO | `render-blueprint/agent-*` |
| Design Knowledge Engine (Ch5) | IMPLEMENTED | NO | `render-blueprint` knowledge engines |
| Design Pipeline (Ch6) | IMPLEMENTED | NO | pipeline orchestrator engines |
| Agent Implementation (Ch7) | IMPLEMENTED | NO | agent engines; BOOK-INDEX title conflict |
| Design Knowledge Platform (Ch8) | PARTIAL (registry) | NO | `design-knowledge-platform/` |
| Intelligent Orchestration (Ch9) | PARTIAL (registry) | NO | `intelligent-orchestration-platform/` |
| Human AI Collaboration (Ch10) | PARTIAL (registry) | NO | `human-ai-collaboration/` |
| Commercial Intelligence Platform (Ch11) | PARTIAL / IMPLEMENTED claims conflict | NO | `commercial-intelligence-platform/` |
| `runDesignAiBookPipeline` | IMPLEMENTED | NO | `design-ai-book/pipeline.ts` (specs only) |
| `USE_RENDER_BLUEPRINT_V18` | IMPLEMENTED flag | Label only | `pipeline-version.ts`; no handler import |

---

## E. Feature-branch DAOS (`not on main`)

| Entity | Status | Branch sample | Evidence |
|--------|--------|---------------|----------|
| `src/lib/daos` kernel | FEATURE-BRANCH | `daos-constitution-v3-volume0-part1-aecb` | 116 files; `index.ts` exports runtime, registry, gates, pipeline, debug |
| Generation mode / Final gate / Debug index | FEATURE-BRANCH | same | `daos/config`, `daos/gates`, `daos/debug` |
| Pipeline / Prompt context | FEATURE-BRANCH | same | `daos/pipeline` |
| Scene graph / overlay / compositor (DAOS) | FEATURE-BRANCH | waves / constitution | `daos/scene-graph`, `daos/overlay`, `daos/compositor` |
| Commercial Genome Beta | FEATURE-BRANCH | `commercial-genome-beta-aecb` | `daos/commercial-genome-beta/` |
| Feature Flag Registry | FEATURE-BRANCH | same | `daos/feature-flag-registry/` |
| Category Intelligence / Attention Hierarchy / Hero Visual Mass | FEATURE-BRANCH | `hero-visual-mass-sprint1-aecb` et al. | typography, commercial-fidelity, compositor hooks; flags in benchmarks |
| DAOS Wave / Stage reports | FEATURE-BRANCH docs | constitution tip `docs/DAOS_WAVE_*`, `DAOS_V2_STAGE_*` | docs-only reports on that tip |

**Known DAOS_* flags (FEATURE-BRANCH; samples from hero tip benchmarks):**  
`DAOS_COMMERCIAL_GENOME_BETA`, `DAOS_COMMERCIAL_LAYOUT_INTEGRATION`, `DAOS_CATEGORY_INTELLIGENCE`, `DAOS_ATTENTION_HIERARCHY`, `DAOS_POST_OVERLAY_DOMINANCE_GATE`, `DAOS_HERO_VISUAL_MASS` — **none present on `main`**.

---

## F. Deprecated

| Entity | Status | Evidence |
|--------|--------|----------|
| Design AI OS wrong taxonomy (Consumer Psychology Ch1) | DEPRECATED | `marketplace-infographic/docs/archive/deprecated-design-ai-os/` |
| `runDesignAiOsPipeline` (claimed in recovered audit) | DEPRECATED / NOT wired | recovered AUDIT docs |
| coverConcept-centric planning | DEPRECATED (claimed) | `DESIGN-AI-v18-PHILOSOPHY.md` |

---

## G. Repo layout claims vs reality (`main`)

| Claimed (`architecture.yaml`) | Status on `main` |
|-------------------------------|------------------|
| `src/lib/platform-core` | PRESENT |
| `src/lib/runtime` | ABSENT |
| `src/lib/contracts` | ABSENT as top-level (nested under platform-core) |
| `src/lib/platforms` | ABSENT |
| `src/lib/providers` | ABSENT as top-level (under render-engine) |
| `src/lib/sdk` | ABSENT |
| `src/lib/assets` | ABSENT |
| `src/lib/legacy` | ABSENT |
| Root `apps/` / `packages/` | ABSENT |

---

**END OF CATALOG**
