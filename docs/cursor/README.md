# Cursor Implementation Plan

> Generated: 2026-07-05T14:46:26.170Z  
> Input: Architecture_Bible.md + Code_Rewrite_Bible.md + Repository Analysis

## Waves

| Wave | Name | Tasks | Group |
|------|------|-------|-------|
| [Wave-01.md](Wave-01.md) | Platform Core | 2 | Platform |
| [Wave-02.md](Wave-02.md) | Contracts | 1 | Contracts |
| [Wave-03.md](Wave-03.md) | Runtime | 1 | Runtime |
| [Wave-04.md](Wave-04.md) | Knowledge | 4 | Platform |
| [Wave-05.md](Wave-05.md) | Commercial | 1 | Platform |
| [Wave-06.md](Wave-06.md) | Creative | 3 | Platform |
| [Wave-07.md](Wave-07.md) | Visual | 1 | Platform |
| [Wave-08.md](Wave-08.md) | Rendering | 1 | Platform |
| [Wave-09.md](Wave-09.md) | Vision | 0 | Vision |
| [Wave-10.md](Wave-10.md) | Learning | 1 | Learning |
| [Wave-11.md](Wave-11.md) | Providers | 1 | Provider |
| [Wave-12.md](Wave-12.md) | Assets | 0 | Assets |
| [Wave-13.md](Wave-13.md) | SDK | 0 | Platform |
| [Wave-14.md](Wave-14.md) | Architecture Validation | 1 | Infrastructure |
| [Wave-15.md](Wave-15.md) | Legacy Cleanup | 1 | Legacy |
| [Wave-16.md](Wave-16.md) | Performance | 0 | Infrastructure |
| [Wave-17.md](Wave-17.md) | Marketplace | 2 | Platform |
| [Wave-18.md](Wave-18.md) | Testing | 0 | Infrastructure |
| [Wave-19.md](Wave-19.md) | Documentation | 0 | Infrastructure |
| [Wave-20.md](Wave-20.md) | Release | 1 | Infrastructure |

**Total tasks:** 21

## Pre-Implementation Checklist

- [ ] Read Architecture Bible Part 24 (Cursor Execution Protocol)
- [ ] Load architecture.yaml DSL
- [ ] Load directive from task
- [ ] Run architecture:scan for current baseline

## Implementation Checklist

- [ ] Reuse code first — no architectural interpretation
- [ ] Minimal diff per task
- [ ] Run unit and integration tests
- [ ] Run architecture:scan

## Post-Implementation Checklist

- [ ] Update directive-registry.md status
- [ ] Write migration report to docs/architecture/migration-logs/
- [ ] Regenerate Code_Rewrite_Bible.md
- [ ] Regenerate cursor wave tasks
