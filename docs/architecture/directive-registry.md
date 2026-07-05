# Directive Registry

> Implementation Directive **DIR-001** — track all executable architecture directives.

Last updated: 2026-07-05

## Chain of Traceability

```
Architecture Bible → ADR → RFC → Implementation Directive → Pull Request → Release
```

## Status Legend

| Status | Meaning |
|--------|---------|
| **Completed** | Merged, acceptance criteria met |
| **In Progress** | Active implementation |
| **Blocked** | Waiting on dependency or decision |
| **Rejected** | Superseded or declined |

---

## Registry

| ID | Title | Priority | Status | ADR | RFC | Wave |
|----|-------|----------|--------|-----|-----|------|
| ADR-001 | Create `docs/architecture/adr/` | HIGH | Completed | — | — | — |
| RFC-001 | Create `docs/rfc/` | MEDIUM | Completed | — | — | — |
| DIR-001 | Directive Registry | HIGH | Completed | — | — | — |
| DSL-001 | Architecture DSL (`architecture.yaml`) | HIGH | Completed | — | — | — |
| EXEC-001 | Cursor Execution Protocol (Part 24) | CRITICAL | Completed | — | — | — |
| PLAN-001 | Implementation Plan (Part 25, Phases 1–8) | CRITICAL | Completed | — | — | — |
| REP-001 | Canonical repository structure (Part 26) | HIGH | Blocked | — | — | 1 |
| DTO-001 | Base Contract & Specifications | Critical | Blocked | ADR-002 | RFC-001 | 02 |
| DTO-002 | ProjectState implementation | Critical | Blocked | ADR-002 | RFC-001 | 02 |
| RUN-001 | Runtime engine skeleton | Critical | Blocked | — | RFC-002 | 01 |
| RUN-002 | EventBus | High | Blocked | — | RFC-002 | 01 |
| RUN-003 | VersionManager | High | Blocked | — | RFC-002 | 01 |
| RUN-004 | Design Graph DAG | High | Blocked | — | RFC-002 | 01 |
| KNG-001 | Knowledge Runtime | High | Blocked | ADR-005 | RFC-003 | 03 |
| KNG-002 | Knowledge Query API | High | Blocked | ADR-005 | RFC-003 | 03 |
| AST-001 | Asset Graph | Medium | Blocked | — | RFC-006 | — |
| AST-002 | Asset Manager | Medium | Blocked | — | RFC-006 | — |
| STD-001 | Directory standards | High | Completed | — | — | — |
| STD-002 | Import rules | High | Completed | — | — | — |
| CI-001 | Architecture Validator | High | Blocked | — | — | — |
| CEO-001 | AI CEO Platform | Medium | Blocked | — | — | — |
| SDK-001 | Platform SDK | Medium | Blocked | — | — | — |

---

## Adding a Directive

1. Create or update ADR if architectural decision required
2. Create RFC if breaking or large change
3. Add row to this registry with status **In Progress**
4. Implement per Directive Template (Part 22)
5. Link PR; set status **Completed** or **Blocked**

## Rules

- Every ADR must reference at least one Implementation Directive
- Every Implementation Directive must reference at least one ADR or RFC
- Cursor executes Directives, not free-form Bible interpretation
