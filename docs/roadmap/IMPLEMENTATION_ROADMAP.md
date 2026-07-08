# DAOS Implementation Roadmap

**Version:** 2.0  
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
| GenerationContext | Vol 25 | Runtime snapshot pilot implemented (Wave 36) |
| Metric registry | Vol 26 | Pilot SSOT for `productAreaRatio` implemented (Wave 35) — remaining metrics pending |
| Foundation Object registry | Vol 27 | pending (foundation-only objects) |
| Feature flags | Vol 28 | Ad-hoc flags |
| Quality / benchmark | Vol 29 | Wave benchmarks exist |
| Research governance | Vol 30 | EKB v1.0 manual |

---

## Wave sequencing (v2.0) — after Waves 35–36

**Council constraint:** only sequencing may change; Constitution and RFCs are not modified.

### Completed

| Wave | RFC | Objective |
|------|-----|-----------|
| 35 | RFC-2600 (W1) | Metric Registry Runtime pilot: `METRIC_PRODUCT_AREA_RATIO` |
| 36 | RFC-2500 (W1) | GenerationContext Runtime snapshot for debug bundle |

### Next Waves (single objective per wave)

| Wave | RFC | Objective |
|------|-----|-----------|
| 37 | RFC-2800 | Feature Flag Registry + lifecycle (remove ad-hoc rollout flags) |
| 38 | RFC-2700 | Foundation Object Registry (foundation-only objects only) |
| 39–41 | RFC-2600 (W2–W4) | Metric Registry Completion (treated as one migration chain) |
| 42 | RFC-2500 (W2) | GenerationContext → PipelineContext Adapter (temporary compatibility) |
| 43 | RFC-2200 | EKB → Genome Loader → Commercial Genome Runtime |
| 44+ | RFC-2400 → RFC-600-R → RFC-2700 → RFC-400-R → RFC-900-R | Knowledge Resolution → DecisionGraph → Commercial Object Registry → SceneGraph Authority → Handler Decomposition |

---

## Foundation Object Registry (naming + scope)

At this stage only runtime foundation objects exist.

Foundation Registry contains only:

- GenerationContext
- MetricValue
- FeatureFlag

Foundation Registry explicitly does NOT contain:

- CommercialGenome
- KnowledgeCandidate
- ResolvedKnowledgeSet
- DecisionGraph
- Rule
- AntiRule

These belong to the Commercial Registry extension after RFC-2200.

---

## Metric Registry Completion (epic)

Treat RFC-2600 W2–W4 as one engineering epic:

Epic name: **Metric Registry Completion**

| Wave | Subwave | Goal |
|------|----------|------|
| 39 | Debug Bundle SSOT | debug bundle consumes registry-owned `ProductAreaRatio` |
| 40 | Audit Consumers read-only | audits/patch consumers never recompute `ProductAreaRatio` |
| 41 | CI Guard | CI rejects new inline `ProductAreaRatio` metric SSOT outside registry |

---

## GenerationContext migration wording

Replace:

GenerationContext → DAOSPipelineContext

With:

GenerationContext → PipelineContext Adapter

Reason:

- `DAOSPipelineContext` is a temporary compatibility layer.
- `GenerationContext` is the canonical runtime object.

---

## Commercial Genome runtime staging (explicit runtime stage)

Before Commercial Genome Runtime introduce an explicit runtime stage:

EKB

↓

Genome Loader

↓

Commercial Genome Runtime

Genome Loader SHALL:

- load validated research artifacts
- load Experimental Knowledge Base
- validate lifecycle
- validate schema
- prepare runtime Genome objects

Commercial Genome SHALL consume only loader output.
Commercial Genome Runtime SHALL NEVER read markdown directly.

---

## Architecture Health + Wave Exit Criteria (mandatory)

Every Wave Report SHALL include:

- `Architecture Health Before`
- `Architecture Health After`
- `Architecture Health Delta` (After - Before)

Architecture Health represents architectural improvement (not implementation size).

Every wave SHALL define **Exit Criteria** answering: “Is the architecture ready for the next Wave?”

Examples:

- Wave 37 Exit Criteria
  - No unmanaged rollout flags remain.
  - Every rollout flag exists inside Feature Flag Registry.
  - Every temporary flag has a removal plan.
- Wave 38 Exit Criteria
  - Every foundation runtime object is registered.
  - Schema validation passes.
  - CI validates registry integrity.
- Wave 39–41 Exit Criteria
  - Debug bundle consumes registry-owned metric values.
  - Audit consumers never recompute `ProductAreaRatio`.
  - CI rejects new inline `ProductAreaRatio` SSOT outside registry.
- Wave 42 Exit Criteria
  - PipelineContext Adapter consumes GenerationContext only through adapter boundaries.
  - No duplicated context reconstruction exists.
- Wave 43 Exit Criteria
  - Genome Loader loads only validated runtime Genome objects.
  - Runtime no longer depends on markdown knowledge.

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
6. Define Exit Criteria and include Architecture Health delta in the Wave Report

---

## Related

- [Engineering Playbook](../engineering/DAOS_ENGINEERING_PLAYBOOK.md)
- [Experimental Knowledge v1.0](../knowledge/Experimental-Knowledge-v1.0.md)
- [PR #52](https://github.com/egmen1-dev/design-ai/pull/52) — constitution ingestion branch
