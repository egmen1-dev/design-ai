# Wave 11 — Providers

> **AUTO-GENERATED** — Part 35 Cursor Task Generator. Regenerate: `npm run architecture:tasks`

| | |
|---|---|
| **Group** | Provider |
| **Tasks** | 1 |
| **Ready** | 0 |
| **Blocked** | 1 |

---

## TASK-110 — Move Prompt to Provider Adapter

| Field | Value |
|-------|-------|
| **Wave** | 11 — Providers |
| **Priority** | Critical |
| **Risk** | critical |
| **State** | Blocked |
| **Group** | Provider |
| **Estimated time** | 12h |
| **Directive** | DSP-003 |

### Dependencies

- TASK-080

### Files

- `src/lib/prompt/`
- `src/lib/providers/`

### Acceptance

- [ ] One prompt compiler
- [ ] LAW-040 satisfied

### Rollback

- Re-enable legacy prompt path

### Architecture Reference

Part 29, DSP-003

**RFC:** RFC-004  
**ADR:** ADR-003  

### Task Score

| Metric | Value |
|--------|-------|
| Complexity | 2/10 |
| Architecture impact | 9/10 |
| Breaking change | No |
| Confidence | 0.92 |

---


*END OF WAVE 11*
