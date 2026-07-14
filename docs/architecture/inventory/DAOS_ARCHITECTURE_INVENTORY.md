# DAOS Architecture Inventory — Full Audit

**Status:** Factual inventory only (no redesign)  
**Date:** 2026-07-14  
**Base checkout audited:** `main` @ current HEAD  
**Additional evidence:** unmerged feature branches listed in §0  

This document answers the eight audit questions with **file-path evidence only**.  
It does **not** propose engines, runtimes, merges, renames, or new abstractions.

---

## 0. Scope of evidence

| Evidence layer | What it is | Path / ref |
|----------------|------------|------------|
| **L0 — `main` tree** | Merged production + docs | this checkout |
| **L1 — Design AI Book / v18 modules on `main`** | Code present; not wired to handler | `marketplace-infographic/src/lib/{render-blueprint,design-ai-book,design-knowledge-platform,intelligent-orchestration-platform,human-ai-collaboration,commercial-intelligence-platform,platform-core}/` |
| **L2 — Unmerged DAOS branches** | Exist on remote; **not on `main`** | e.g. `origin/cursor/daos-constitution-v3-volume0-part1-aecb`, `origin/cursor/commercial-genome-beta-aecb`, `origin/cursor/hero-visual-mass-sprint1-aecb`, waves `daos-wave-*`, `daos-v2-stage-*` |
| **L3 — Deprecated archive** | Wrong taxonomy, do not treat as current | `marketplace-infographic/docs/archive/deprecated-design-ai-os/` |

**Naming note:** On `main`, the product/OS is documented as **Design AI Operating System** / **Design AI OS**. The literal acronym **DAOS** appears primarily on unmerged L2 branches and docs (`docs/DAOS_Specification.md` on constitution branch = rename/alias of Architecture Bible content). **MarketplaceOS** and **AI Commerce Core** were not found in `main` or sampled L2 docs/code (`git grep` empty).

---

## 1. Which architectural entities already exist?

### 1.1 Named on `main` (docs +/or code)

| Entity | Aliases seen | Primary evidence |
|--------|--------------|------------------|
| Design AI Operating System | Design AI OS, Design AI | `docs/Architecture_Bible.md` (title); `AUDIT.md` |
| Architecture Bible (Volume I) | — | `docs/Architecture_Bible.md` |
| Code Rewrite Bible (Volume II) | — | `docs/Code_Rewrite_Bible.md` (**placeholder / Not Started**) |
| Architecture DSL | `architecture.yaml` | `docs/architecture/architecture.yaml` |
| Platform Core | — | `marketplace-infographic/src/lib/platform-core/` |
| IRuntime (interface) | Runtime (contract) | `marketplace-infographic/src/lib/platform-core/interfaces/IRuntime.ts` |
| Architecture / Platform / Provider registries | — | `marketplace-infographic/src/lib/platform-core/registry/` |
| Design Governance v17.1 | Platform 01 (Bible) | `marketplace-infographic/src/lib/design-governance/` |
| Render Engine v17 | Platform 04 (Bible) | `marketplace-infographic/src/lib/render-engine/` |
| Design Process / Creative path | Creative Platform (Bible migration label) | `marketplace-infographic/src/lib/design-process/` |
| Design Knowledge (prod intel) | Knowledge Engine (AUDIT) | `marketplace-infographic/src/lib/design/` (`retrieveKnowledgeContext`, genome, trends, market, assets) |
| Layout Engine | — | `marketplace-infographic/src/lib/layout-engine/` |
| Composition Engine | — | `marketplace-infographic/src/lib/composition/` |
| Scene compositor | Canvas Composer (v17) | `compositing/scene-compositor.ts`, `render-engine/composer/canvas-composer.ts` |
| Production Agents (directors/critics-as-experts) | Art Director, Senior AD, Chief Design Director, CTR Expert, … | `marketplace-infographic/src/lib/agents/` |
| Render Blueprint / v18 Agent Ecosystem | Ch 3–7 Design AI Book | `marketplace-infographic/src/lib/render-blueprint/` |
| Design AI Book pipeline | Ch 8→11 orchestrator | `marketplace-infographic/src/lib/design-ai-book/pipeline.ts` |
| Design Knowledge Platform | Book Ch 8 | `marketplace-infographic/src/lib/design-knowledge-platform/` |
| Intelligent Orchestration Platform | Book Ch 9 | `marketplace-infographic/src/lib/intelligent-orchestration-platform/` |
| Human AI Collaboration | Book Ch 10 | `marketplace-infographic/src/lib/human-ai-collaboration/` |
| Commercial Intelligence Platform | Book Ch 11; Bible “Commercial Platform” (related naming) | `marketplace-infographic/src/lib/commercial-intelligence-platform/` |
| Generation handler (monolith orchestrator) | — | `marketplace-infographic/src/lib/generate-infographic-handler.ts` |
| Deprecated Design AI OS chapter model | Consumer Psychology Ch1 taxonomy | `marketplace-infographic/docs/archive/deprecated-design-ai-os/` |

### 1.2 Named primarily on unmerged L2 (DAOS feature lineages)

| Entity | Branch sample | Path sample |
|--------|---------------|-------------|
| `src/lib/daos/` kernel (contracts, runtime, registry, gates, pipeline, scene-graph, overlay, compositor hooks, templates, debug, events, governance) | `cursor/daos-constitution-v3-volume0-part1-aecb` | `marketplace-infographic/src/lib/daos/` (116 files on that tip) |
| DAOS Specification (Volume I copy/alias) | same | `docs/DAOS_Specification.md` (TOC mirrors Architecture Bible) |
| DAOS Architecture Constitution v3 | same | `docs/DAOS_Architecture_Constitution_v3/` |
| Commercial Genome Beta | `cursor/commercial-genome-beta-aecb` | `marketplace-infographic/src/lib/daos/commercial-genome-beta/` |
| Feature Flag Registry (DAOS flags) | same | `marketplace-infographic/src/lib/daos/feature-flag-registry/` |
| Attention / typography gates, commercial fidelity, hero visual mass | `cursor/hero-visual-mass-sprint1-aecb` | e.g. `src/lib/typography/`, `src/lib/commercial-fidelity/`, `src/lib/compositing/hero-visual-mass.ts` |
| Scene Graph / kernel | constitution + related wave branches | `src/lib/daos/scene-graph/`, also `src/lib/scene-graph/`, `src/lib/kernel/` on that tip |

### 1.3 Documented in Bible / YAML but folders missing on `main` code tree

Target layout in `docs/architecture/architecture.yaml` → `repository.layers.lib.subdirectories`:

`runtime`, `contracts`, `platforms`, `providers`, `sdk`, `assets`, `legacy`

**On `main` code:** `runtime/`, `platforms/`, `providers/`, `sdk/`, `assets/`, `legacy/` as **top-level** `src/lib/` dirs = **absent**. Nested equivalents exist partially (`platform-core/contracts/`, `render-engine/providers/`).

`apps/` and `packages/` at repo root = **absent**.

---

## 2. Implemented in code (on `main`)

**IMPLEMENTED** = TypeScript module exists and is importable.

| Entity | Path | Wired to live handler? |
|--------|------|------------------------|
| `handleGenerateInfographic` | `.../generate-infographic-handler.ts` | **YES** — `src/app/api/generate-infographic/route.ts` |
| Agents directors/experts | `.../lib/agents/` | **YES** (marketplace layout path) |
| Design intel + genome + scene/composition directors | `.../lib/design/` | **YES** |
| Layout / composition | `layout-engine/`, `composition/` | **YES** |
| Compositing | `compositing/` | **YES** (photoreal merge) |
| Render Engine v17 path | `render-engine/` via `regenerateMarketplaceBackground` → `renderWithRetry` | **YES** when `RENDER_ENGINE_V17` / `PIPELINE_V17` |
| Design Governance v17.1 | `design-governance/` | **YES** when flag / auto with v17 |
| Platform Core | `platform-core/` | **PARTIAL** — present; **not** the handler orchestrator |
| Render Blueprint Ch3–7 | `render-blueprint/` | Code+specs **YES**; handler wire **NO** |
| Book Ch8–11 platforms + `runDesignAiBookPipeline` | `design-*-platform/`, `design-ai-book/pipeline.ts` | Code **YES**; handler wire **NO** |
| Root legacy handler | `/workspace/src/lib/generate-infographic-handler.ts` | Separate thin path; marketplace app uses marketplace-infographic copy |

---

## 3. Docs-only (or placeholder) on `main`

| Entity | Evidence | Status |
|--------|----------|--------|
| Code Rewrite Bible content | `docs/Code_Rewrite_Bible.md` | **DOCS-ONLY / Not Started** |
| Runtime as sole orchestrator (`RuntimeV2`) | `architecture.yaml` `project.runtime: RuntimeV2`; RFC-002; RUN-* directives often **Blocked** in `docs/architecture/directive-registry.md` | **DOCS / BLOCKED** |
| ProjectState as LAW-004 SSOT across pipeline | Bible + ADR-002; production still packed `SdPayload` / handler locals | **MOSTLY DOCS** (`platform-core/project-state` exists as core support — extent vs Bible laws = **UNKNOWN** without full wire audit) |
| RenderGraph | ADR-004 / RFC-005 | **DOCS / directive blocked** |
| AI CEO Platform | Bible Part 9 | **DOCS** |
| Vision Platform (blocking) | Bible Stage 13 / LAW-009 | **DOCS** (critics lists as specs) |
| Asset Platform (centralized) | Bible Part 14 / RFC-006 | **DOCS** (filesystem access scattered) |
| MarketplaceOS | — | **NOT FOUND** |
| AI Commerce Core | — | **NOT FOUND** |
| Full Bible Platforms (Research / Learning as separate platforms) | Parts 3–4 | **DOCS** vs partial intel functions in `design/` |

---

## 4. Partially implemented

| Entity | What’s present | What’s missing / not wired |
|--------|----------------|----------------------------|
| Design Knowledge Platform (Ch8) | Section registry + runner | Recovered scaffolds; full engines = pending per `DESIGN-AI-BOOK-INDEX-CH1-11.md` |
| Intelligent Orchestration (Ch9) | registry + runner | same |
| Human AI Collaboration (Ch10) | registry + runner | same |
| Commercial Intelligence (Ch11) | ecosystem engines + manifest (claimed runnable) | Doc maturity conflict (see §6); not in live handler |
| Render Blueprint / Agent Ecosystem | large engine surface + specs | `RENDER_BLUEPRINT_V18` only changes `PIPELINE_VERSION` string (`pipeline-version.ts`); handler has **zero** imports |
| Platform Core | registries, interfaces, ProjectState helpers | Not owning generation orchestration (handler monolith remains) |
| Design Genome (prod) | `design/` genome APIs + Prisma `DesignGenome` | Distinct from L2 **Commercial Genome Beta** (unmerged) |
| Governance duplicate handler | `design-governance/scores/generate-infographic-handler.ts` | Exists; APIs do **not** import it |

---

## 5. Obsolete / replaced / superseded

| Entity | Marker | Superseded by |
|--------|--------|---------------|
| Deprecated Design AI OS (Ch1 = Consumer Psychology) | `docs/archive/deprecated-design-ai-os/README.md`; `RESTORATION-STATUS.md` | Design AI Book Ch1–11 model (`design-ai-book/`, `DESIGN-AI-BOOK-INDEX`) |
| `coverConceptId` / ScenePlan concept fields | `DESIGN-AI-v18-PHILOSOPHY.md` | scene environment fields (claimed) |
| Legacy `/api/generate` Ollama HTML path | `AUDIT.md` / Bible Appendix E notes | `/api/generate-infographic` → handler |
| HuggingFace SD as primary (when v17 on) | `MIGRATION-v17.md` | Pollinations / provider chain via render-engine |
| Old hung-agent `design-ai-os/` scaffolds | `full-project-archive/RECOVERY-MANIFEST.md` | archived / ported into CIP ecosystem runners |

**Unresolved supersession:** Architecture Bible Platforms (Parts 3–11) vs Design AI Book Chapters (1–11) vs unmerged L2 `src/lib/daos/` — three lineages; **no single doc on `main` declares L2 DAOS kernel as SSOT**.

---

## 6. Duplication of responsibility / terminology

| Overlap | Locations | Nature |
|---------|-----------|--------|
| **Three “Chapters 1–11” taxonomies** | Bible Parts; Design AI Book; Deprecated OS | Different chapter meanings; OS deprecated |
| **Knowledge Engine vs Knowledge Platform** | Book Ch5 (`render-blueprint` knowledge engines) vs Ch8 (`design-knowledge-platform`) | Explicitly different layers in AUDIT-CHIEF / BOOK-INDEX; easy conflation |
| **Commercial Platform vs Commercial Intelligence Platform vs Commercial Genome** | Bible Part; Book Ch11; L2 `daos/commercial-genome-beta` | Related commercial intent; different modules / merge states |
| **Runtime** | Bible Runtime Engine; `IRuntime`; L2 `daos/runtime`; missing `src/lib/runtime/` on main | Name collision; implementations diverge |
| **Genome** | Prod Design Genome (`design/` + Prisma); L2 Commercial Genome Beta | Different systems |
| **Director / Critic agents** | `lib/agents/` (prod) vs `render-blueprint/*-engine.ts` (v18) vs design scene/composition directors | Parallel implementations |
| **Generation handlers** | `marketplace-infographic/.../generate-infographic-handler.ts`; `design-governance/scores/...`; `/workspace/src/lib/...` | Duplicates / stale copies |
| **DAOS_Specification.md (L2) vs Architecture_Bible.md (`main`)** | Same TOC / Volume I claim | Alias/duplication across branches |
| **Ch7 title** | BOOK-INDEX: “Platform Architecture”; files: Agent Implementation | Naming conflict |
| **Ch11 maturity statements** | `RESTORATION-STATUS.md` “all engines runnable” vs BOOK-INDEX registry-only for 11.1–11.17 vs AUDIT-CHIEF 6/10 | **Unresolved conflict** (see Conflicts doc) |

---

## 7. Technical specs that are still absent (relative to claimed lineages)

| Gap | Basis |
|-----|-------|
| Volume II / Code Rewrite Bible body | Placeholder only |
| Single reconciled entity dictionary mapping Bible ↔ Book ↔ L2 DAOS | This inventory is first audit pass; no prior SSOT catalog on `main` |
| Spec declaring relationship of unmerged `src/lib/daos/` to Platform Core / Book | Absent on `main` |
| Specs for MarketplaceOS / AI Commerce Core | Names **not found** — cannot inventory as missing specs for products that do not exist in repo |
| Wiring RFC for `runDesignAiBookPipeline` into handler | Planned in RFC-002 / RESTORATION-STATUS; not implemented |
| Metric Validation Sprint (Product Dominance ↔ Human) deliverable on `main` | **NOT FOUND** as completed corpus on this checkout |

---

## 8. Actual end-to-end pipeline (fact)

See companion: [`DAOS_E2E_PIPELINE_FACTUAL.md`](./DAOS_E2E_PIPELINE_FACTUAL.md).

**One-line fact:** Live marketplace generation = monolithic `handleGenerateInfographic` (v16.9 / v17 / v17.1 labels), **not** Book pipeline, **not** Bible Runtime, **not** unmerged `src/lib/daos` (absent from `main`).

---

## 9. Boundary: DAOS / MarketplaceOS / AI Commerce Core

| Name | On `main` | On L2 | Boundary claim |
|------|-----------|-------|----------------|
| **Design AI OS / DAOS** | Documented as Design AI OS; code = marketplace-infographic lib modules | `src/lib/daos/` + DAOS_* docs/flags on unmerged branches | Accidental dual naming: Bible/Book = Design AI OS; feature work often branded DAOS |
| **MarketplaceOS** | **NOT FOUND** | **NOT FOUND** (sampled) | No boundary to draw |
| **AI Commerce Core** | **NOT FOUND** | **NOT FOUND** (sampled) | No boundary to draw |
| **Commercial Intelligence Platform (Ch11)** | Code present; docs say does not generate images; handoff via manifest | — | Closest “commercial core” **name that exists** — not “AI Commerce Core” |
| **marketplace-infographic app** | Next.js SaaS for WB/Ozon-style covers | — | Product runtime; contains Design AI lib |

**Factual boundary today:**  
`docs/` (architecture intent) ≠ `src/lib/design-ai-book` + render-blueprint (parallel OS code) ≠ `generate-infographic-handler.ts` (production). Unmerged L2 `daos/` is a **fourth** surface not merged to `main`.

---

## Companion documents

| File | Contents |
|------|----------|
| [`DAOS_ENTITY_CATALOG.md`](./DAOS_ENTITY_CATALOG.md) | Entity × status matrix |
| [`DAOS_E2E_PIPELINE_FACTUAL.md`](./DAOS_E2E_PIPELINE_FACTUAL.md) | Stage-by-stage live pipeline |
| [`DAOS_DOC_CONFLICTS.md`](./DAOS_DOC_CONFLICTS.md) | Documented contradictions |

---

## Audit method (for reproducibility)

```bash
# main surface
ls marketplace-infographic/src/lib/
test -d marketplace-infographic/src/lib/daos && echo YES || echo NO_DAOS_ON_MAIN
rg -n 'MarketplaceOS|AI Commerce Core|DAOS_' docs marketplace-infographic/src || true

# unmerged DAOS surfaces
git ls-tree -d --name-only origin/cursor/daos-constitution-v3-volume0-part1-aecb:marketplace-infographic/src/lib
git ls-tree -d --name-only origin/cursor/commercial-genome-beta-aecb:marketplace-infographic/src/lib/daos
```

**END OF INVENTORY**
