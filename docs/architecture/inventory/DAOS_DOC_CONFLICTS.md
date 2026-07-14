# DAOS Documentation Conflicts — Unresolved

**Rule of this file:** record contradictions; **do not resolve** them.

---

## C1. Three incompatible “Chapters 1–11” maps

| Universe | Ch1 starts as | Evidence |
|----------|---------------|----------|
| Architecture Bible | Canonical Spec / Parts (not book chapters) | `docs/Architecture_Bible.md` |
| Design AI Book (current intended) | Design Philosophy → … → Commercial Intelligence | `marketplace-infographic/docs/DESIGN-AI-BOOK-INDEX-CH1-11.md` |
| Deprecated Design AI OS | Consumer Psychology Platform | `docs/archive/deprecated-design-ai-os/`; recovered `AUDIT-DESIGN-AI-OS-CHAPTERS-1-11.md` |

Recovered OS audit states the OS and v18 render-blueprint universes are **unrelated**.

---

## C2. “Design AI OS” vs “DAOS” vs product app

| Claim | Where |
|-------|-------|
| System name = Design AI Operating System | Architecture Bible title on `main` |
| Spec file titled DAOS Specification with same Volume I TOC | L2 `docs/DAOS_Specification.md` |
| Code namespace `src/lib/daos` | L2 only; **absent on `main`** |
| Product = marketplace infographic SaaS | `README.md`, `AUDIT.md` |

Conflict: branding/namespace not consolidated; `main` docs rarely use “DAOS”.

---

## C3. Knowledge Engine (Ch5) vs Knowledge Platform (Ch8)

BOOK-INDEX / AUDIT-CHIEF treat them as different layers. Names are easily conflated in conversation and RFCs.

---

## C4. Chapter 7 title vs file naming

| Source | Title |
|--------|-------|
| `DESIGN-AI-BOOK-INDEX-CH1-11.md` | Ch7 = “Platform Architecture” |
| Files | `DESIGN-AI-v18-CHAPTER-7-*-AGENT-*` / Agent Implementation |

---

## C5. Commercial Intelligence Chapter 11 maturity

| Source | Claim |
|--------|-------|
| `RESTORATION-STATUS.md` | Ch11 “all engines runnable” |
| `DESIGN-AI-BOOK-INDEX` / Ch11 docs | 11.1–11.17 often **registry**; 11.18–11.20 full |
| Chief architect audit | ~6/10 maturity |

Unresolved which claim is authoritative for `main`.

---

## C6. SECTIONS-CATALOG Ch8–10 section counts vs BOOK-INDEX

Export catalogs sometimes show **0 labeled sections** while BOOK-INDEX asserts 27 / 19 / 15 registries in code. Possible outdated export; conflict recorded without picking a side.

Evidence folders: `marketplace-infographic/docs/audit-export/`, `docs/full-project-archive/audit-export/`.

---

## C7. Production version story

| Source | Claim |
|--------|-------|
| RESTORATION / migrations / Appendix E | Prod = **v17.1** governance |
| `pipeline-version.ts` | Dynamic label including fake v18 when flag set |
| `AUDIT.md` | Older Ollama-centric narrative without full v17/governance detail |
| L2 DAOS waves / genome / hero mass | Parallel “DAOS product” narrative **not on main** |

---

## C8. “Already exists” vs “must create”

Architecture Bible Part 2 lists many intelligence pieces as present; later Parts / directive registry list Runtime, ProjectState, RenderGraph, CEO, etc. as blocked or to-create. Same Bible contains both tones.

---

## C9. Test count drift

| Source | Count |
|--------|-------|
| `RESTORATION-STATUS.md` | 219 (120+99) |
| Chief architect audit | ~208 |
| Recovered OS audit | ~94 |

Different scopes; treat numbers as non-comparable without matching scripts.

---

## C10. MarketplaceOS / AI Commerce Core

Requested audit questions refer to these products. **No occurrences found** in `main` or sampled L2 tips. Any boundary diagram naming them would be invention — excluded from factual inventory.

---

## C11. Duplicate generation handlers

| Path | Role |
|------|------|
| `marketplace-infographic/src/lib/generate-infographic-handler.ts` | Live |
| `marketplace-infographic/src/lib/design-governance/scores/generate-infographic-handler.ts` | Stale/parallel copy |
| `/workspace/src/lib/generate-infographic-handler.ts` | Legacy thin handler |

Docs that say “the handler” without a path are ambiguous.

---

## C12. Genome naming

| Name | Location | Merge state |
|------|----------|-------------|
| Design Genome (prod intel) | `src/lib/design/` + Prisma | on `main` |
| Commercial Genome Beta | `src/lib/daos/commercial-genome-beta/` | FEATURE-BRANCH |
| Design Genome Platform (Bible) | Architecture Bible Part 6 | DOCS |

---

**END OF CONFLICTS LOG**
