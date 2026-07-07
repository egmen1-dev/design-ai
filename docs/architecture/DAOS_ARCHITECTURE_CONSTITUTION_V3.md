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
| 2 | Research System | [volume-02-research-system](./constitution-v3/volume-02-research-system/) | pending |
| 3 | Commercial Knowledge Engine | [volume-03-commercial-knowledge-engine](./constitution-v3/volume-03-commercial-knowledge-engine/) | pending |
| 4 | Decision Engine | [volume-04-decision-engine](./constitution-v3/volume-04-decision-engine/) | pending |
| 5 | SceneGraph | [volume-05-scenegraph](./constitution-v3/volume-05-scenegraph/) | pending |
| 6 | Rendering System | [volume-06-rendering-system](./constitution-v3/volume-06-rendering-system/) | pending |
| 7 | Commercial Genome | [volume-07-commercial-genome](./constitution-v3/volume-07-commercial-genome/) | pending |
| 8 | Experimental Knowledge Base Integration | [volume-08-experimental-knowledge-base](./constitution-v3/volume-08-experimental-knowledge-base/) | pending |
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
