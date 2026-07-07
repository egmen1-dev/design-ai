# DAOS Documentation

**Policy:** [Constitution](./architecture/DAOS_ARCHITECTURE_CONSTITUTION_V3.md) changes rarely. Day-to-day work uses engineering guides, knowledge, RFCs, ADRs, and the implementation roadmap.

```text
docs/
├── architecture/          ← canonical constitution (stable)
├── engineering/           ← how to build (read before code)
├── knowledge/             ← experimental + commercial knowledge
├── adr/                   ← architecture decision records
├── rfc/                   ← requests for comments
└── roadmap/               ← what to implement next
```

---

## Read order (implementation)

1. [CURSOR_ENGINEERING_KERNEL.md](./engineering/CURSOR_ENGINEERING_KERNEL.md) — before any task
2. [DAOS_ARCHITECTURE_CONSTITUTION_V3.md](./architecture/DAOS_ARCHITECTURE_CONSTITUTION_V3.md) — when architecture is in scope
3. [PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md](./engineering/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md) — before writing code
4. [DAOS_ENGINEERING_PLAYBOOK.md](./engineering/DAOS_ENGINEERING_PLAYBOOK.md) — process reference
5. [IMPLEMENTATION_ROADMAP.md](./roadmap/IMPLEMENTATION_ROADMAP.md) — current priorities

---

## architecture/

| Document | Role |
|----------|------|
| [DAOS_ARCHITECTURE_CONSTITUTION_V3.md](./architecture/DAOS_ARCHITECTURE_CONSTITUTION_V3.md) | Canonical architecture index (Volumes 0–30+) |
| [constitution-v3/](./architecture/constitution-v3/) | Per-volume RFC/SPEC text |

Legacy DSL and reports remain under `architecture/` for migration reference.

---

## engineering/

| Document | Role |
|----------|------|
| [CURSOR_ENGINEERING_KERNEL.md](./engineering/CURSOR_ENGINEERING_KERNEL.md) | Agent kernel — highest priority |
| [DAOS_ENGINEERING_PLAYBOOK.md](./engineering/DAOS_ENGINEERING_PLAYBOOK.md) | Mandatory engineering process |
| [PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md](./engineering/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md) | Architecture review gate before implementation |

---

## knowledge/

| Path | Role |
|------|------|
| [Experimental-Knowledge-v1.0.md](./knowledge/Experimental-Knowledge-v1.0.md) | Evidence-backed experimental rules (EKB) |
| [experimental-artifacts/](./knowledge/experimental-artifacts/) | Per-entry YAML fragments |
| [Commercial-Genome/](./knowledge/Commercial-Genome/) | Certified commercial knowledge (lifecycle-managed) |

---

## adr/ · rfc/ · roadmap/

| Path | Role |
|------|------|
| [adr/](./adr/) | Why architectural choices were made |
| [rfc/](./rfc/) | Proposed architectural changes before implementation |
| [roadmap/IMPLEMENTATION_ROADMAP.md](./roadmap/IMPLEMENTATION_ROADMAP.md) | Implementation phases and priorities |

---

## Superseded / archive

- [DAOS_Specification.md](./DAOS_Specification.md) — v1.0 narrative (superseded by Constitution v3)
- Wave and stage reports at `docs/DAOS_WAVE_*` and `docs/DAOS_V2_STAGE_*` — historical evidence
