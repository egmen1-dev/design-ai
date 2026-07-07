# Architecture Decision Records

Architecture Decision Records (ADRs) document **why** architectural choices were made.

See **Part 20** in [DAOS_Specification.md](../DAOS_Specification.md).

## Source of Truth

**Primary:** [`architecture.yaml`](architecture.yaml) — machine-readable DSL (Part 23)

**Constitution v3:** [`DAOS_ARCHITECTURE_CONSTITUTION_V3.md`](DAOS_ARCHITECTURE_CONSTITUTION_V3.md) — canonical agent/runtime language (SPEC-000+)

**Experimental knowledge:** [`DAOS_EXPERIMENTAL_KNOWLEDGE_BASE.md`](DAOS_EXPERIMENTAL_KNOWLEDGE_BASE.md) — stage evidence, anti-rules (subordinate to constitution)

**Secondary:** Architecture Bible, ADRs, RFCs (human-readable)

**Execution:** Part 24 Cursor Execution Protocol — Cursor executes DSL, does not redesign architecture.

**Implementation Plan:** Part 25 — Phases 1–8 with final acceptance criteria in `architecture.yaml` → `phases`, `final_acceptance`.

**Repository:** Part 26–27 — canonical structure in `architecture.yaml` → `repository`, `repository_v2`. REP-001 (blocked), REP-002 (refactor).

**Glossary:** Appendix A — canonical terms in Bible and `architecture.yaml` → `glossary`.

**Architecture Index:** Appendix B — topic → Part map in `architecture.yaml` → `architecture_index`.

**Implementation Index:** Appendix C — directive prefixes and execution order in `architecture.yaml` → `implementation_index`.

**Volume I:** Complete (Appendix D). Next: [`Code_Rewrite_Bible.md`](../Code_Rewrite_Bible.md).

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-000](adr/ADR-000.md) | Template | Accepted |
| [ADR-001](adr/ADR-001.md) | Prompt Driven → Specification Driven | Accepted |
| [ADR-002](adr/ADR-002.md) | ProjectState | Accepted |
| [ADR-003](adr/ADR-003.md) | Provider Adapter | Accepted |
| [ADR-004](adr/ADR-004.md) | RenderGraph | Accepted |
| [ADR-005](adr/ADR-005.md) | Knowledge Engine | Accepted |

## Rules

- Every architectural change requires a new ADR
- Every ADR must reference Implementation Directives
- Every Implementation Directive must reference an ADR or RFC

## Related

- [Directive Registry](directive-registry.md)
- [RFC Index](../rfc/README.md)
