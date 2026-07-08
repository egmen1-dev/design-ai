# DAOS Implementation Roadmap

**Version:** 1.0  
**Status:** Living document  
**Constitution:** [DAOS_ARCHITECTURE_CONSTITUTION_V3.md](../architecture/DAOS_ARCHITECTURE_CONSTITUTION_V3.md) (change rarely)

This roadmap tracks **code implementation** against the constitution. Update it each wave; do not duplicate normative rules here.

---

## Documentation layers (stable → volatile)

| Layer | Path | Change frequency |
|-------|------|------------------|
| Constitution | `docs/architecture/` | Rare |
| Engineering | `docs/engineering/` | Occasional |
| Knowledge | `docs/knowledge/` | Continuous (evidence-driven) |
| ADR / RFC | `docs/adr/`, `docs/rfc/` | Per architectural change |
| Roadmap | `docs/roadmap/` | Every wave |

---

## Current state (summary)

| Area | Docs | Code |
|------|------|------|
| Constitution v3 | Volumes 0–30 ingested | Partial |
| SceneGraph / compositor | Vol 4, EKB | Stage 5.x hooks |
| DecisionGraph / engine | Vol 6, 8 | Not fully implemented |
| Commercial Genome | Vol 22–23, `knowledge/Commercial-Genome/` | Planned |
| Knowledge resolution | Vol 24 | Not implemented |
| GenerationContext | Vol 25 | Implicit only |
| Metric registry | Vol 26 | Duplicate metrics exist |
| Object registry | Vol 27 | Organic growth |
| Feature flags | Vol 28 | Ad-hoc flags |
| Quality / benchmark | Vol 29 | Wave benchmarks exist |
| Research governance | Vol 30 | EKB v1.0 manual |

---

## Phase A — Foundation (in progress)

**Goal:** Single sources of truth before new features.

| Priority | Task | Constitution | Status |
|----------|------|--------------|--------|
| A1 | Metric registry — eliminate duplicate `productArea` calculations | Vol 26 | Wave 1 implemented (RFC-2600) |
| A2 | `GenerationContext` canonical object | Vol 25 | Wave 36 implemented (RFC-2500) |
| A3 | Feature flag registry + lifecycle | Vol 28 | pending |
| A4 | Object registry validation in CI | Vol 27 | pending |

---

## Phase B — Commercial reasoning

**Goal:** DecisionGraph + knowledge pipeline.

| Priority | Task | Constitution | Status |
|----------|------|--------------|--------|
| B1 | Knowledge Resolution Engine | Vol 24 | pending |
| B2 | Commercial Genome runtime + promotion from EKB | Vol 22–23, `knowledge/` | pending |
| B3 | Decision Engine consumes ResolvedKnowledgeSet only | Vol 6, 24 | pending |
| B4 | AntiRule enforcement (e.g. compositor hook) | Vol 22 SPEC-2207 | partial evidence |

---

## Phase C — Quality and research

**Goal:** Deterministic promotion path.

| Priority | Task | Constitution | Status |
|----------|------|--------------|--------|
| C1 | Certified benchmark registry | Vol 29 | pending |
| C2 | Regression gate in CI | Vol 29 | partial |
| C3 | Research pipeline automation | Vol 30 | pending |
| C4 | EKB → Knowledge Candidate → Genome promotion | Vol 30, 22 | pending |

---

## Phase D — Remaining constitution volumes

Placeholder volumes (content TBD or pending ingestion):

| Vol | Title | Folder |
|-----|-------|--------|
| 31 | Learning Engine | `volume-09-learning-engine` |
| 32 | Marketplace Intelligence | `volume-10-marketplace-intelligence` |
| 33 | Governance | `volume-12-governance` |
| 34 | Benchmark Framework | `volume-13-benchmark-framework` |
| 35 | Evolution Rules | `volume-14-evolution-rules` |
| 36 | Migration Strategy | `volume-15-migration-strategy` |

---

## Per-wave checklist

Every wave SHALL:

1. Run [Pre-Implementation Architecture Review](../engineering/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md)
2. Reduce at least one debt item (Vol 21)
3. Benchmark before production (Vol 29)
4. Update EKB or Genome when commercial knowledge changes
5. Update this roadmap

---

## Related

- [Engineering Playbook](../engineering/DAOS_ENGINEERING_PLAYBOOK.md)
- [Experimental Knowledge v1.0](../knowledge/Experimental-Knowledge-v1.0.md)
- [PR #52](https://github.com/egmen1-dev/design-ai/pull/52) — constitution ingestion branch
