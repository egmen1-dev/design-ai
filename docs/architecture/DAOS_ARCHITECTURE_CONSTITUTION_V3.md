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
| 11 | State Machine Specification | [volume-11-state-machine-specification](./constitution-v3/volume-11-state-machine-specification/) | canonical |
| 12 | Event Protocol Specification | [volume-12-event-protocol-specification](./constitution-v3/volume-12-event-protocol-specification/) | canonical |
| 13 | DAOS Protocol Language (DPL) | [volume-13-daos-protocol-language](./constitution-v3/volume-13-daos-protocol-language/) | canonical |
| 14 | Commercial Instruction Set Architecture (CISA) | [volume-14-commercial-instruction-set-architecture](./constitution-v3/volume-14-commercial-instruction-set-architecture/) | canonical |
| 15 | Commercial Scheduler | [volume-15-commercial-scheduler](./constitution-v3/volume-15-commercial-scheduler/) | canonical |
| 16 | DAOS Kernel Specification | [volume-16-daos-kernel-specification](./constitution-v3/volume-16-daos-kernel-specification/) | canonical |
| 17 | Module System & Plugin ABI | [volume-17-module-system-plugin-abi](./constitution-v3/volume-17-module-system-plugin-abi/) | canonical |
| 18 | Platform Operating Modes | [volume-18-platform-operating-modes](./constitution-v3/volume-18-platform-operating-modes/) | canonical |
| 19 | System Invariants | [volume-19-system-invariants](./constitution-v3/volume-19-system-invariants/) | canonical |
| 20 | Learning Engine | [volume-09-learning-engine](./constitution-v3/volume-09-learning-engine/) | pending |
| 21 | Marketplace Intelligence | [volume-10-marketplace-intelligence](./constitution-v3/volume-10-marketplace-intelligence/) | pending |
| — | Agent Communication Protocol | [volume-11-agent-communication-protocol](./constitution-v3/volume-11-agent-communication-protocol/) | superseded → Vol 7 / 13 |
| 22 | Governance | [volume-12-governance](./constitution-v3/volume-12-governance/) | pending |
| 23 | Benchmark Framework | [volume-13-benchmark-framework](./constitution-v3/volume-13-benchmark-framework/) | pending |
| 24 | Evolution Rules | [volume-14-evolution-rules](./constitution-v3/volume-14-evolution-rules/) | pending |
| 25 | Migration Strategy | [volume-15-migration-strategy](./constitution-v3/volume-15-migration-strategy/) | pending |

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

---

# Volume 11 — State Machine Specification

**Architecture status:** Canonical · **Specification type:** Finite State Machine · **Normative:** Mandatory

Deterministic generation lifecycle FSM: canonical states, transitions, ownership, rollback, and audit trail.

→ Full text: [constitution-v3/volume-11-state-machine-specification/part-01/](./constitution-v3/volume-11-state-machine-specification/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-1100 | System State Machine |
| RFC-1101 | Canonical States |
| SPEC-1100 | INITIALIZED |
| SPEC-1101 | RESEARCH_READY |
| SPEC-1102 | KNOWLEDGE_READY |
| SPEC-1103 | DECISION_READY |
| SPEC-1104 | DECISION_FINALIZED |
| SPEC-1105 | SCENE_READY |
| SPEC-1106 | EXECUTION_READY |
| SPEC-1107 | COMPOSITING |
| SPEC-1108 | OVERLAY_RENDERING |
| SPEC-1109 | RENDER_COMPLETED |
| SPEC-1110 | GOVERNANCE_RUNNING |
| SPEC-1111 | BENCHMARK_RUNNING |
| SPEC-1112 | LEARNING_RUNNING |
| SPEC-1113 | COMPLETED |
| RFC-1102 | State Transition Rules |
| SPEC-1114 | Forbidden Transitions |
| SPEC-1115 | State Ownership |
| RFC-1103 | Rollback |
| SPEC-1116 | Failure State |
| RFC-1104 | State Determinism |
| SPEC-1117 | Event Model |
| SPEC-1118 | State Audit Trail |
| RFC-1105 | Canonical Lifecycle |

**END OF VOLUME 11** (content in [part-01/](./constitution-v3/volume-11-state-machine-specification/part-01/))

---

# Volume 12 — Event Protocol Specification

**Architecture status:** Canonical · **Protocol version:** 3.0 · **Communication model:** Event Driven · **Normative:** Mandatory

All state mutations via immutable Protocol Events; event bus, categories, ordering, replay, and canonical mutation rule.

→ Full text: [constitution-v3/volume-12-event-protocol-specification/part-01/](./constitution-v3/volume-12-event-protocol-specification/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-1200 | Event Driven Architecture |
| RFC-1201 | Event Bus |
| SPEC-1200 | Event Structure |
| SPEC-1201 | Event Metadata |
| SPEC-1202 | Event Categories |
| SPEC-1203 | Research Events |
| SPEC-1204 | Knowledge Events |
| SPEC-1205 | Decision Events |
| SPEC-1206 | SceneGraph Events |
| SPEC-1207 | Execution Events |
| SPEC-1208 | Governance Events |
| SPEC-1209 | Benchmark Events |
| SPEC-1210 | Learning Events |
| RFC-1202 | Event Ordering |
| SPEC-1211 | Event Ownership |
| RFC-1203 | Event Immutability |
| SPEC-1212 | Event Replay |
| SPEC-1213 | Event Correlation |
| RFC-1204 | Event Validation |
| SPEC-1214 | Event Versioning |
| RFC-1205 | Event Idempotency |
| SPEC-1215 | Event Subscription |
| RFC-1206 | Event Security |
| SPEC-1216 | Event Audit |
| RFC-1207 | Canonical Mutation Rule |

**END OF VOLUME 12** (content in [part-01/](./constitution-v3/volume-12-event-protocol-specification/part-01/))

---

# Volume 13 — DAOS Protocol Language (DPL)

**Architecture status:** Canonical · **Protocol:** DAOS Protocol Language · **Version:** 1.0 · **Normative:** Mandatory

Native protocol primitives, canonical reasoning chain, grammar, determinism, and provider isolation.

→ Full text: [constitution-v3/volume-13-daos-protocol-language/part-01/](./constitution-v3/volume-13-daos-protocol-language/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-1300 | Purpose |
| RFC-1301 | Protocol Layers |
| SPEC-1300 | Primitive Objects |
| SPEC-1301 | FACT |
| SPEC-1302 | RULE |
| SPEC-1303 | LAW |
| SPEC-1304 | CONSTRAINT |
| SPEC-1305 | METRIC |
| SPEC-1306 | FINDING |
| SPEC-1307 | EVIDENCE |
| SPEC-1308 | PROPOSAL |
| SPEC-1309 | DECISION |
| SPEC-1310 | COMMAND |
| SPEC-1311 | EVENT |
| SPEC-1312 | STATE |
| RFC-1302 | Canonical Reasoning Chain |
| SPEC-1313 | Protocol Grammar |
| RFC-1303 | Protocol Determinism |
| SPEC-1314 | Protocol Validation |
| SPEC-1315 | Protocol Compatibility |
| RFC-1304 | Canonical Internal Language |
| SPEC-1316 | Provider Isolation |
| RFC-1305 | Explainability |
| RFC-1306 | Commercial Integrity |

**END OF VOLUME 13** (content in [part-01/](./constitution-v3/volume-13-daos-protocol-language/part-01/))

---

# Volume 14 — Commercial Instruction Set Architecture (CISA)

**Architecture status:** Canonical · **Execution model:** Instruction Based · **Instruction version:** 1.0 · **Normative:** Mandatory

Standardized commercial instructions, scheduler, dependency graph, atomicity, and directed instruction graph execution model.

→ Full text: [constitution-v3/volume-14-commercial-instruction-set-architecture/part-01/](./constitution-v3/volume-14-commercial-instruction-set-architecture/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-1400 | Purpose |
| RFC-1401 | Instruction Lifecycle |
| SPEC-1400 | Instruction Structure |
| SPEC-1401 | Instruction Metadata |
| RFC-1402 | Instruction Categories |
| SPEC-1402 | Knowledge Instructions |
| SPEC-1403 | Decision Instructions |
| SPEC-1404 | Scene Instructions |
| SPEC-1405 | Geometry Instructions |
| SPEC-1406 | Overlay Instructions |
| SPEC-1407 | Typography Instructions |
| SPEC-1408 | Lighting Instructions |
| SPEC-1409 | Camera Instructions |
| SPEC-1410 | Governance Instructions |
| SPEC-1411 | Benchmark Instructions |
| SPEC-1412 | Learning Instructions |
| RFC-1403 | Instruction Scheduler |
| SPEC-1413 | Dependency Graph |
| RFC-1404 | Instruction Atomicity |
| SPEC-1414 | Instruction Validation |
| RFC-1405 | Instruction Idempotency |
| SPEC-1415 | Instruction Trace |
| RFC-1406 | Execution Priority |
| SPEC-1416 | Instruction Invariants |
| RFC-1407 | Canonical Execution Model |

**END OF VOLUME 14** (content in [part-01/](./constitution-v3/volume-14-commercial-instruction-set-architecture/part-01/))

---

# Volume 15 — Commercial Scheduler

**Architecture status:** Canonical · **Execution model:** Dependency Driven · **Normative:** Mandatory

Dependency-driven pipeline coordination: DAG execution, cache reuse, invalidation, incremental recomputation, and deterministic scheduling.

→ Full text: [constitution-v3/volume-15-commercial-scheduler/part-01/](./constitution-v3/volume-15-commercial-scheduler/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-1500 | Commercial Scheduler |
| RFC-1501 | Scheduler Responsibilities |
| SPEC-1500 | Scheduler Input |
| SPEC-1501 | Scheduler Output |
| RFC-1502 | Dependency Graph |
| SPEC-1502 | Dependency Types |
| SPEC-1503 | Execution Graph |
| RFC-1503 | Topological Ordering |
| SPEC-1504 | Parallel Execution |
| SPEC-1505 | Synchronization Barrier |
| RFC-1504 | Cache Reuse |
| SPEC-1506 | Incremental Execution |
| RFC-1505 | Invalidation Engine |
| SPEC-1507 | Invalidation Rules |
| SPEC-1508 | Dirty Nodes |
| RFC-1506 | Retry Policy |
| SPEC-1509 | Cancellation |
| RFC-1507 | Priority Queue |
| SPEC-1510 | Execution Budget |
| RFC-1508 | Deterministic Scheduling |
| SPEC-1511 | Scheduler Diagnostics |
| RFC-1509 | Scheduler Events |
| SPEC-1512 | Critical Path |
| RFC-1510 | Commercial Integrity |

**END OF VOLUME 15** (content in [part-01/](./constitution-v3/volume-15-commercial-scheduler/part-01/))

---

# Volume 16 — DAOS Kernel Specification

**Architecture status:** Canonical · **Layer:** Kernel · **Kernel version:** 1.0 · **Normative:** Mandatory

Immutable execution core: lifecycle, protocol validation, scheduling, event bus, security, API, boot/shutdown, and determinism.

→ Full text: [constitution-v3/volume-16-daos-kernel-specification/part-01/](./constitution-v3/volume-16-daos-kernel-specification/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-1600 | DAOS Kernel |
| RFC-1601 | Kernel Responsibilities |
| SPEC-1600 | Kernel Layers |
| SPEC-1601 | Kernel Components |
| RFC-1602 | Kernel Ownership |
| SPEC-1602 | Lifecycle Manager |
| SPEC-1603 | Protocol Validator |
| SPEC-1604 | State Manager |
| SPEC-1605 | Dependency Engine |
| SPEC-1606 | Scheduler |
| SPEC-1607 | Event Bus |
| RFC-1603 | Security Model |
| SPEC-1608 | Object Registry |
| SPEC-1609 | Compatibility Manager |
| RFC-1604 | Runtime Isolation |
| SPEC-1610 | Diagnostics Manager |
| RFC-1605 | Kernel API |
| SPEC-1611 | Kernel Invariants |
| RFC-1606 | Kernel Extension Policy |
| SPEC-1612 | Kernel Boot Sequence |
| RFC-1607 | Kernel Shutdown |
| SPEC-1613 | Kernel Audit |
| RFC-1608 | Kernel Determinism |

**END OF VOLUME 16** (content in [part-01/](./constitution-v3/volume-16-daos-kernel-specification/part-01/))

---

# Volume 17 — Module System & Plugin ABI

**Architecture status:** Canonical · **Extension model:** Plugin Based · **Compatibility:** ABI Stable · **Normative:** Mandatory

Plugin manifest, capabilities, permissions, ABI, isolation, provider/marketplace independence, and certification.

→ Full text: [constitution-v3/volume-17-module-system-plugin-abi/part-01/](./constitution-v3/volume-17-module-system-plugin-abi/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-1700 | DAOS Module System |
| RFC-1701 | Kernel Independence |
| SPEC-1700 | Plugin Categories |
| SPEC-1701 | Plugin Manifest |
| RFC-1702 | Plugin Lifecycle |
| SPEC-1702 | Plugin Initialization |
| SPEC-1703 | Plugin Capabilities |
| RFC-1703 | Read / Write Permissions |
| SPEC-1704 | Read Matrix |
| SPEC-1705 | Write Matrix |
| RFC-1704 | Ownership Rules |
| SPEC-1706 | Plugin ABI |
| RFC-1705 | ABI Compatibility |
| SPEC-1707 | Plugin Dependencies |
| RFC-1706 | Plugin Isolation |
| SPEC-1708 | Event Subscription |
| SPEC-1709 | Diagnostics Contract |
| RFC-1707 | Provider Independence |
| SPEC-1710 | Marketplace Independence |
| RFC-1708 | Research Independence |
| SPEC-1711 | Commercial Critic Plugins |
| RFC-1709 | Plugin Certification |
| SPEC-1712 | Plugin Registry |
| RFC-1710 | Experimental Plugins |
| SPEC-1713 | Hot Swapping |
| RFC-1711 | Long-Term Stability |

**END OF VOLUME 17** (content in [part-01/](./constitution-v3/volume-17-module-system-plugin-abi/part-01/))

---

# Volume 18 — Platform Operating Modes

**Architecture status:** Canonical · **Platform layer:** Operating Modes · **Normative:** Mandatory · **Version:** 1.0

Explicit execution modes (Research → Exploration → Refinement → Production → Learning) with isolation, transitions, knowledge promotion, and mode diagnostics.

→ Full text: [constitution-v3/volume-18-platform-operating-modes/part-01/](./constitution-v3/volume-18-platform-operating-modes/part-01/)

| Spec / RFC | Title |
|------------|-------|
| RFC-1800 | Platform Operating Modes |
| RFC-1801 | Canonical Modes |
| SPEC-1800 | Research Mode |
| SPEC-1801 | Exploration Mode |
| SPEC-1802 | Refinement Mode |
| SPEC-1803 | Production Mode |
| SPEC-1804 | Learning Mode |
| RFC-1802 | Mode Isolation |
| SPEC-1805 | Transition Matrix |
| RFC-1803 | Knowledge Promotion |
| SPEC-1806 | Experimental Knowledge |
| RFC-1804 | Production Integrity |
| SPEC-1807 | Exploration Diversity |
| SPEC-1808 | Refinement Strategy |
| RFC-1805 | Rule Of One Change |
| SPEC-1809 | Best Version Registry |
| RFC-1806 | Experiment Integration |
| SPEC-1810 | Human Validation |
| RFC-1807 | Commercial Objective Preservation |
| SPEC-1811 | Mode Diagnostics |
| RFC-1808 | Long-Term Evolution |
| RFC-1809 | Fundamental Principle |

**END OF VOLUME 18** (content in [part-01/](./constitution-v3/volume-18-platform-operating-modes/part-01/))

---

# Volume 19 — System Invariants

**Architecture status:** Canonical · **Layer:** Global Invariants · **Normative:** Mandatory · **Priority:** Highest

Properties that SHALL remain true for every generation lifecycle: commercial goal immutability, SSOT, decision integrity, evidence-first, determinism, separation, governance/learning independence, explainability, and traceability.

→ Full text: [constitution-v3/volume-19-system-invariants/part-01/](./constitution-v3/volume-19-system-invariants/part-01/)

| RFC | Title |
|-----|-------|
| RFC-1900 | Global Invariants |
| RFC-1901 | Commercial Goal Invariant |
| RFC-1902 | Single Source of Truth |
| RFC-1903 | Decision Integrity |
| RFC-1904 | Evidence First |
| RFC-1905 | Deterministic Execution |
| RFC-1906 | Knowledge Separation |
| RFC-1907 | Rendering Separation |
| RFC-1908 | Governance Independence |
| RFC-1909 | Learning Independence |
| RFC-1910 | Experimental Isolation |
| RFC-1911 | Rule of One Change |
| RFC-1912 | Explainability |
| RFC-1913 | Traceability |
| RFC-1914 | Plugin Isolation |
| RFC-1915 | Research Priority |
| RFC-1916 | Commercial Genome Priority |
| RFC-1917 | Human Override |
| RFC-1918 | Backward Compatibility |
| RFC-1919 | Commercial Identity |
| RFC-1920 | Fundamental Principle |

**END OF VOLUME 19** (content in [part-01/](./constitution-v3/volume-19-system-invariants/part-01/))
