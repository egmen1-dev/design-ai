# DAOS Architecture Constitution v3

**Status:** Draft → Canonical  
**Version:** 3.0  
**Audience:** Cursor, DAOS Agents, Developers  
**Human Readability:** Secondary  
**Machine Interpretability:** Primary  
**Authority:** Canonical  

> This is the main project document. After approval it becomes the single source of architectural truth.  
> Any architecture change is made here first, then implemented in code.

**Base path:** [`constitution-v3/`](./constitution-v3/)

---

# Table of Contents

| Volume | Title | Path | Status |
|--------|-------|------|--------|
| 0 | DAOS Language Specification | [volume-00-language-specification](./constitution-v3/volume-00-language-specification/) | Part 1–2 draft |
| 1 | Core Architecture | [volume-01-core-architecture](./constitution-v3/volume-01-core-architecture/) | Part 1 draft |
| 2 | Research System | [volume-02-research-system](./constitution-v3/volume-02-research-system/) | Part 1 draft |
| 3 | Core Domain Model | [volume-03-core-domain-model](./constitution-v3/volume-03-core-domain-model/) | Part 1–2 draft |
| 4 | SceneGraph | [volume-04-scenegraph](./constitution-v3/volume-04-scenegraph/) | Part 1 draft |
| 5 | Commercial Knowledge System | [volume-05-commercial-knowledge-system](./constitution-v3/volume-05-commercial-knowledge-system/) | Part 1 draft |
| 6 | Decision Engine | [volume-06-decision-engine](./constitution-v3/volume-06-decision-engine/) | Part 1–2 draft |
| 7 | Agent Reasoning Protocol | [volume-07-agent-reasoning-protocol](./constitution-v3/volume-07-agent-reasoning-protocol/) | Part 1 draft |
| 8 | Commercial Reasoning System | [volume-08-commercial-reasoning-system](./constitution-v3/volume-08-commercial-reasoning-system/) | Part 1 draft |
| 9 | Execution Architecture Specification | [volume-09-execution-architecture](./constitution-v3/volume-09-execution-architecture/) | Part 1 canonical |
| 10 | Canonical Data Contracts | [volume-10-canonical-data-contracts](./constitution-v3/volume-10-canonical-data-contracts/) | Part 1 canonical |
| 11 | Learning Engine | [volume-09-learning-engine](./constitution-v3/volume-09-learning-engine/) | pending |
| 12 | Marketplace Intelligence | [volume-10-marketplace-intelligence](./constitution-v3/volume-10-marketplace-intelligence/) | pending |
| — | Agent Communication Protocol | [volume-11-agent-communication-protocol](./constitution-v3/volume-11-agent-communication-protocol/) | superseded → Vol 7 |
| 13 | Governance | [volume-12-governance](./constitution-v3/volume-12-governance/) | pending |
| 14 | Benchmark Framework | [volume-13-benchmark-framework](./constitution-v3/volume-13-benchmark-framework/) | pending |
| 15 | Evolution Rules | [volume-14-evolution-rules](./constitution-v3/volume-14-evolution-rules/) | pending |
| 16 | Migration Strategy | [volume-15-migration-strategy](./constitution-v3/volume-15-migration-strategy/) | pending |

## Appendices

| Appendix | Title | Path | Status |
|----------|-------|------|--------|
| A | Vocabulary | [appendix-a-vocabulary](./constitution-v3/appendix-a-vocabulary/) | pending |
| B | Message Contracts | [appendix-b-message-contracts](./constitution-v3/appendix-b-message-contracts/) | pending |
| C | Feature Flags | [appendix-c-feature-flags](./constitution-v3/appendix-c-feature-flags/) | pending |
| D | ADR Registry | [appendix-d-adr-registry](./constitution-v3/appendix-d-adr-registry/) | pending |
| E | RFC Registry | [appendix-e-rfc-registry](./constitution-v3/appendix-e-rfc-registry/) | pending |

## Related (outside constitution tree)

- [DAOS_EXPERIMENTAL_KNOWLEDGE_BASE.md](./DAOS_EXPERIMENTAL_KNOWLEDGE_BASE.md) — stage evidence (feeds Volume 8)
- [architecture.yaml](./architecture.yaml) — legacy DSL (migrate per Volume 15)
- [DAOS_Specification.md](../DAOS_Specification.md) — v1.0 narrative (superseded by this constitution)

---

# Volume 0 — DAOS Language Specification (summary)

Part 1 defines system identity, architectural philosophy, core layers, sources of truth, and layer responsibilities.

→ Full text: [constitution-v3/volume-00-language-specification/part-01/](./constitution-v3/volume-00-language-specification/part-01/)

| Spec | Title |
|------|-------|
| RFC-000 | Purpose |
| SPEC-000 | System Identity |
| SPEC-001 | Architectural Philosophy |
| SPEC-002 | Core Layers |
| SPEC-003 | Single Sources Of Truth |
| SPEC-004 | Layer Responsibilities |

**END OF VOLUME 0 — PART 1** (content in [part-01/](./constitution-v3/volume-00-language-specification/part-01/))

---

# Volume 0 — DAOS Protocol (Part 2)

Part 2 defines DAOS Protocol: communication principles, flow, message envelope, object types, Finding through LearningEvent, and protocol restrictions.

→ Full text: [constitution-v3/volume-00-language-specification/part-02/](./constitution-v3/volume-00-language-specification/part-02/)

| Spec / RFC | Title |
|------------|-------|
| RFC-001 | DAOS Protocol |
| SPEC-005 | Communication Principles |
| SPEC-006 | Communication Flow |
| SPEC-007 | Message Envelope |
| SPEC-008 | Supported Object Types |
| SPEC-009 | Finding |
| SPEC-010 | Proposal |
| SPEC-011 | Decision |
| SPEC-012 | Constraint |
| SPEC-013 | Scene Mutation |
| SPEC-014 | Evidence |
| SPEC-015 | Experiment |
| SPEC-016 | Knowledge Rule |
| SPEC-017 | Learning Event |
| SPEC-018 | Protocol Restrictions |
| RFC-002 | Agent Communication Contract |

**END OF VOLUME 0 — PART 2** (content in [part-02/](./constitution-v3/volume-00-language-specification/part-02/))

---

# Volume 1 — Core Architecture (Part 1)

Engine topology, ownership, lifecycle, isolation, dependencies, execution layer, and evolution loop.

→ Full text: [constitution-v3/volume-01-core-architecture/part-01/](./constitution-v3/volume-01-core-architecture/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-100 | Core Architecture |
| SPEC-100 | Engine Topology |
| SPEC-101 | Global Ownership |
| SPEC-102 | Engine Lifecycle |
| SPEC-103 | Engine Isolation |
| SPEC-104 | Dependency Rules |
| SPEC-105 | Forbidden Dependencies |
| RFC-101 | Single Decision Principle |
| SPEC-106 | Immutable Commercial Intent |
| RFC-102 | Execution Layer |
| SPEC-107 | Renderer Contract |
| SPEC-108 | Provider Contract |
| SPEC-109 | Benchmark Position |
| SPEC-110 | Learning Position |
| RFC-103 | Evolution Loop |
| SPEC-111 | Engine Health Contract |

**END OF VOLUME 1 — PART 1** (content in [part-01/](./constitution-v3/volume-01-core-architecture/part-01/))

---

# Volume 2 — Research Engine (Part 1)

Research philosophy, object model, evidence, validation, promotion pipeline, and experimental knowledge base.

→ Full text: [constitution-v3/volume-02-research-system/part-01/](./constitution-v3/volume-02-research-system/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-200 | Research Philosophy |
| SPEC-200 | Research Responsibilities |
| SPEC-201 | Research Object Model |
| SPEC-202 | Research Project |
| SPEC-203 | Hypothesis |
| SPEC-204 | Experiment |
| SPEC-205 | Experiment Series |
| SPEC-206 | Evidence |
| SPEC-207 | Validation |
| SPEC-208 | Candidate Knowledge |
| SPEC-209 | Promotion Pipeline |
| RFC-201 | Research Never Touches Production |
| SPEC-210 | Experimental Knowledge Base |
| SPEC-211 | Human Research |
| SPEC-212 | Experiment Confidence |
| SPEC-213 | Rule Promotion Policy |
| RFC-202 | Experimental Knowledge Priority |

**END OF VOLUME 2 — PART 1** (content in [part-01/](./constitution-v3/volume-02-research-system/part-01/))

---

# Volume 3 — Core Domain Model (Part 1)

Persistent business entities: commercial knowledge hierarchy, domain objects, genome, and stability model.

→ Full text: [constitution-v3/volume-03-core-domain-model/part-01/](./constitution-v3/volume-03-core-domain-model/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-300 | Core Domain Model |
| SPEC-300 | Domain Architecture |
| SPEC-301 | Root Domain Objects |
| RFC-301 | Commercial Knowledge Hierarchy |
| SPEC-302 | Commercial Law |
| SPEC-303 | Commercial Rule |
| SPEC-304 | Category Rule |
| SPEC-305 | Brand DNA |
| SPEC-306 | Adaptive Parameter |
| RFC-302 | Commercial Genome |
| SPEC-307 | Knowledge Rule |
| SPEC-308 | Domain Stability |

**END OF VOLUME 3 — PART 1** (content in [part-01/](./constitution-v3/volume-03-core-domain-model/part-01/))

---

# Volume 3 — Decision Domain Model (Part 2)

DecisionGraph, commercial goals, decision nodes, traceability, confidence, and completeness rules.

→ Full text: [constitution-v3/volume-03-core-domain-model/part-02/](./constitution-v3/volume-03-core-domain-model/part-02/)

| Spec / RFC | Title |
|------------|-------|
| RFC-303 | Decision Model |
| SPEC-309 | DecisionGraph |
| SPEC-310 | Commercial Goal |
| SPEC-311 | Customer Intent |
| SPEC-312 | Commercial Concept |
| SPEC-313 | Decision Categories |
| SPEC-314 | Hero Decision |
| SPEC-315 | Environment Decision |
| SPEC-316 | Composition Decision |
| SPEC-317 | Typography Decision |
| SPEC-318 | Lighting Decision |
| SPEC-319 | Camera Decision |
| SPEC-320 | Color Decision |
| SPEC-321 | Overlay Decision |
| RFC-304 | Rule of One Decision |
| SPEC-322 | Decision Traceability |
| SPEC-323 | Decision Confidence |
| RFC-305 | Decision Completeness |

**END OF VOLUME 3 — PART 2** (content in [part-02/](./constitution-v3/volume-03-core-domain-model/part-02/))

---

# Volume 4 — SceneGraph (Part 1)

SceneGraph as single source of truth: planned vs actual states, node ownership, drift, lifecycle, and invariants.

→ Full text: [constitution-v3/volume-04-scenegraph/part-01/](./constitution-v3/volume-04-scenegraph/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-400 | SceneGraph |
| RFC-401 | Single Source Of Truth |
| SPEC-400 | SceneGraph Structure |
| SPEC-401 | Planned State |
| SPEC-402 | Actual State |
| RFC-402 | Planned Never Overwrites Actual |
| SPEC-403 | Product Node |
| SPEC-404 | Overlay Node |
| SPEC-405 | Typography Node |
| SPEC-406 | Composition Node |
| SPEC-407 | Governance Node |
| RFC-403 | Node Ownership |
| SPEC-408 | SceneGraph History |
| SPEC-409 | Mutation Protocol |
| RFC-404 | Drift |
| SPEC-410 | SceneGraph Lifecycle |
| RFC-405 | Legacy Objects |
| SPEC-411 | SceneGraph Invariants |
| RFC-406 | Future Migration |

**END OF VOLUME 4 — PART 1** (content in [part-01/](./constitution-v3/volume-04-scenegraph/part-01/))

---

# Volume 5 — Commercial Knowledge System (Part 1)

Commercial Knowledge layers, genome graph, rule lifecycle, experimental KB staging, and consumption boundaries.

→ Full text: [constitution-v3/volume-05-commercial-knowledge-system/part-01/](./constitution-v3/volume-05-commercial-knowledge-system/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-500 | Commercial Knowledge |
| RFC-501 | Knowledge First Architecture |
| SPEC-500 | Commercial Knowledge Layers |
| SPEC-501 | Commercial Law |
| SPEC-502 | Commercial Rule |
| SPEC-503 | Category Knowledge |
| SPEC-504 | Brand Knowledge |
| SPEC-505 | Adaptive Parameters |
| RFC-502 | Commercial Genome |
| SPEC-506 | Commercial Genome Structure |
| SPEC-507 | Knowledge Relationships |
| SPEC-508 | Rule Lifecycle |
| RFC-503 | Rule Confidence |
| SPEC-509 | Knowledge Versioning |
| SPEC-510 | Knowledge Sources |
| RFC-504 | Experimental Knowledge Base |
| SPEC-511 | Promotion Requirements |
| RFC-505 | Research Priority |
| SPEC-512 | Knowledge Consumption |

**END OF VOLUME 5 — PART 1** (content in [part-01/](./constitution-v3/volume-05-commercial-knowledge-system/part-01/))

---

# Volume 6 — Decision Engine (Part 1)

Multi-agent expert proposals, conflict resolution, decision validation, and DecisionGraph output contract.

→ Full text: [constitution-v3/volume-06-decision-engine/part-01/](./constitution-v3/volume-06-decision-engine/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-600 | Decision Engine |
| RFC-601 | Multi-Agent Decision Model |
| SPEC-600 | Expert Categories |
| SPEC-601 | Expert Responsibilities |
| SPEC-602 | Proposal Generation |
| SPEC-603 | Proposal Evaluation |
| RFC-602 | Conflict Resolution |
| SPEC-604 | Decision Priority |
| SPEC-605 | Decision Objects |
| RFC-603 | Rule of One Decision |
| SPEC-606 | Decision Trace |
| SPEC-607 | Decision Confidence |
| RFC-604 | Decision Consistency |
| SPEC-608 | Decision Validation |
| RFC-605 | Decision Finality |
| SPEC-609 | Decision Output Contract |

**END OF VOLUME 6 — PART 1** (content in [part-01/](./constitution-v3/volume-06-decision-engine/part-01/))

---

# Volume 6 — Decision Lifecycle (Part 2)

Deterministic 13-stage commercial generation lifecycle, retry strategy, failure recovery, and commercial invariants.

→ Full text: [constitution-v3/volume-06-decision-engine/part-02/](./constitution-v3/volume-06-decision-engine/part-02/)

| Spec / RFC | Title |
|------------|-------|
| RFC-606 | Commercial Decision Lifecycle |
| SPEC-610 | Decision Lifecycle |
| SPEC-611 | Stage 1 — Context Initialization |
| SPEC-612 | Stage 2 — Knowledge Retrieval |
| SPEC-613 | Stage 3 — Product Understanding |
| SPEC-614 | Stage 4 — Marketplace Understanding |
| SPEC-615 | Stage 5 — Proposal Generation |
| SPEC-616 | Stage 6 — Proposal Validation |
| RFC-607 | Proposal Independence |
| SPEC-617 | Stage 7 — Conflict Resolution |
| SPEC-618 | Stage 8 — DecisionGraph Assembly |
| SPEC-619 | Stage 9 — SceneGraph Assembly |
| SPEC-620 | Stage 10 — Execution |
| SPEC-621 | Stage 11 — Governance |
| SPEC-622 | Stage 12 — Benchmark |
| SPEC-623 | Stage 13 — Learning |
| RFC-608 | Retry Strategy |
| SPEC-624 | Failure Recovery |
| SPEC-625 | Deterministic Execution |
| RFC-609 | Commercial Invariants |

**END OF VOLUME 6 — PART 2** (content in [part-02/](./constitution-v3/volume-06-decision-engine/part-02/))

---

# Volume 7 — Agent Reasoning Protocol (Part 1)

Unified expert reasoning pipeline, protocol objects, determinism, and commercial thinking priorities.

→ Full text: [constitution-v3/volume-07-agent-reasoning-protocol/part-01/](./constitution-v3/volume-07-agent-reasoning-protocol/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-700 | Unified Agent Reasoning |
| SPEC-700 | Universal Reasoning Pipeline |
| SPEC-701 | Input Contract |
| SPEC-702 | Internal Reasoning Stages |
| SPEC-703 | Context Validation |
| SPEC-704 | Knowledge Lookup |
| SPEC-705 | Evidence Evaluation |
| SPEC-706 | Constraint Detection |
| SPEC-707 | Finding Generation |
| SPEC-708 | Proposal Generation |
| SPEC-709 | Risk Evaluation |
| SPEC-710 | Confidence Calculation |
| RFC-701 | Reasoning Determinism |
| SPEC-711 | Proposal Completeness |
| SPEC-712 | Agent Memory |
| SPEC-713 | Forbidden Behaviors |
| SPEC-714 | Required Behaviors |
| RFC-702 | Native Communication Language |
| SPEC-715 | Explainability |
| RFC-703 | Commercial Thinking |

**END OF VOLUME 7 — PART 1** (content in [part-01/](./constitution-v3/volume-07-agent-reasoning-protocol/part-01/))

---

# Volume 8 — Commercial Reasoning System (Part 1)

Highest intelligence layer: commercial objective, evidence-weighted reasoning, scoring, minimal complexity, and commercial-first optimization.

→ Full text: [constitution-v3/volume-08-commercial-reasoning-system/part-01/](./constitution-v3/volume-08-commercial-reasoning-system/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-800 | Commercial Reasoning |
| RFC-801 | Commercial Thinking Hierarchy |
| SPEC-800 | Commercial Objective |
| SPEC-801 | Commercial Context |
| SPEC-802 | Reasoning Domains |
| RFC-802 | Evidence Weighted Reasoning |
| SPEC-803 | Commercial Hypothesis |
| SPEC-804 | Commercial Impact Estimation |
| SPEC-805 | Commercial Cost |
| RFC-803 | Rule Of Minimal Complexity |
| SPEC-806 | Commercial Score |
| SPEC-807 | Proposal Comparison |
| RFC-804 | Explainable Commercial Reasoning |
| SPEC-808 | Commercial Consistency |
| RFC-805 | Human Research Priority |
| SPEC-809 | Commercial Memory |
| SPEC-810 | Reasoning Output |
| RFC-806 | Commercial First Principle |

**END OF VOLUME 8 — PART 1** (content in [part-01/](./constitution-v3/volume-08-commercial-reasoning-system/part-01/))

---

# Volume 9 — Execution Architecture Specification (Part 1)

**Architecture status:** Canonical · **Normative language:** RFC 2119

Execution topology, module contracts, actual-state priority, and provider independence.

→ Full text: [constitution-v3/volume-09-execution-architecture/part-01/](./constitution-v3/volume-09-execution-architecture/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-900 | Execution Layer |
| SPEC-900 | Execution Topology |
| SPEC-901 | Execution Contract |
| SPEC-902 | Geometry Resolver |
| SPEC-903 | Scene Composer |
| SPEC-904 | Product Composer |
| SPEC-905 | Typography Renderer |
| SPEC-906 | Overlay Renderer |
| SPEC-907 | HTML Renderer |
| SPEC-908 | Provider Adapter |
| SPEC-909 | Bitmap Renderer |
| SPEC-910 | Execution Diagnostics |
| SPEC-911 | Execution Constraints |
| RFC-901 | Execution Invariants |
| SPEC-912 | Actual State Update |
| SPEC-913 | Actual Geometry Priority |
| SPEC-914 | Execution Failures |
| RFC-902 | Rendering Independence |

**END OF VOLUME 9 — PART 1** (content in [part-01/](./constitution-v3/volume-09-execution-architecture/part-01/))

---

# Volume 10 — Canonical Data Contracts (Part 1)

**Architecture status:** Canonical · **Schema version:** 3.0 · **Serialization:** JSON · **Validation:** Strict

Universal metadata, canonical schemas for DecisionGraph, SceneGraph, protocol objects, and legacy projection rules.

→ Full text: [constitution-v3/volume-10-canonical-data-contracts/part-01/](./constitution-v3/volume-10-canonical-data-contracts/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-1000 | Canonical Data Model |
| RFC-1001 | Serialization Rules |
| SPEC-1000 | Universal Metadata |
| SPEC-1001 | Object Identity |
| SPEC-1002 | DecisionGraph Schema |
| SPEC-1003 | SceneGraph Schema |
| SPEC-1004 | Scene Node Schema |
| SPEC-1005 | Product Node |
| SPEC-1006 | Overlay Node |
| SPEC-1007 | Typography Node |
| SPEC-1008 | Finding Schema |
| SPEC-1009 | Proposal Schema |
| SPEC-1010 | Constraint Schema |
| SPEC-1011 | Evidence Schema |
| SPEC-1012 | Experiment Schema |
| SPEC-1013 | Commercial Law Schema |
| SPEC-1014 | Commercial Rule Schema |
| SPEC-1015 | Knowledge Rule Schema |
| SPEC-1016 | Benchmark Result |
| SPEC-1017 | Learning Event |
| SPEC-1018 | Compatibility Rules |
| RFC-1002 | Canonical Object Rule |
| SPEC-1019 | Legacy Compatibility |

**END OF VOLUME 10 — PART 1** (content in [part-01/](./constitution-v3/volume-10-canonical-data-contracts/part-01/))
