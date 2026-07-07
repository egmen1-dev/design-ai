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
| 6 | Decision Engine | [volume-06-decision-engine](./constitution-v3/volume-06-decision-engine/) | pending |
| 7 | Rendering System | [volume-07-rendering-system](./constitution-v3/volume-07-rendering-system/) | pending |
| 9 | Learning Engine | [volume-09-learning-engine](./constitution-v3/volume-09-learning-engine/) | pending |
| 10 | Marketplace Intelligence | [volume-10-marketplace-intelligence](./constitution-v3/volume-10-marketplace-intelligence/) | pending |
| 11 | Agent Communication Protocol | [volume-11-agent-communication-protocol](./constitution-v3/volume-11-agent-communication-protocol/) | pending |
| 12 | Governance | [volume-12-governance](./constitution-v3/volume-12-governance/) | pending |
| 13 | Benchmark Framework | [volume-13-benchmark-framework](./constitution-v3/volume-13-benchmark-framework/) | pending |
| 14 | Evolution Rules | [volume-14-evolution-rules](./constitution-v3/volume-14-evolution-rules/) | pending |
| 15 | Migration Strategy | [volume-15-migration-strategy](./constitution-v3/volume-15-migration-strategy/) | pending |

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
