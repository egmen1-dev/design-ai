# Migration Report — {DIRECTIVE_ID}

> Generated per Part 24 Cursor Execution Protocol.  
> Directive: **{DIRECTIVE_ID}** — {DIRECTIVE_TITLE}  
> Date: {YYYY-MM-DD}  
> Wave: {WAVE_NUMBER}

---

## Summary

| Field | Value |
|-------|-------|
| **Directive** | {DIRECTIVE_ID} |
| **Status** | Completed / Blocked / Partial |
| **Architecture Score (before)** | {SCORE_BEFORE} |
| **Architecture Score (after)** | {SCORE_AFTER} |
| **Coverage** | {COVERAGE}% |
| **Reuse estimate** | {REUSE}% |

---

## Modified Files

| File | Change |
|------|--------|
| `{path}` | {brief description} |

---

## Created Files

| File | Purpose |
|------|---------|
| `{path}` | {purpose} |

---

## Deleted Files

| File | Reason |
|------|--------|
| `{path}` | {reason} |

---

## Tests

| Suite | Result |
|-------|--------|
| Unit | Pass / Fail |
| Integration | Pass / Fail |
| Architecture | Pass / Fail |
| Marketplace | Pass / Fail / N/A |

---

## Architecture Validation

| Check | Result |
|-------|--------|
| Platform boundaries | Pass / Fail |
| Contracts | Pass / Fail |
| Runtime | Pass / Fail |
| Providers | Pass / Fail |
| Prompt (LAW-001) | Pass / Fail |
| Legacy imports | Pass / Fail |

---

## Remaining Tasks

- [ ] {task 1}
- [ ] {task 2}

---

## Directive Registry Update

Update `docs/architecture/directive-registry.md`: set **{DIRECTIVE_ID}** status to Completed / Blocked.

---

## Migration Log

```
{timestamp} STEP 1  Read Architecture Bible
{timestamp} STEP 2  Load architecture.yaml
{timestamp} STEP 3  Load directive {DIRECTIVE_ID}
...
{timestamp} STEP 10 Migration report generated
```
