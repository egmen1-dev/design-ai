# DESIGN AI — Book Index (Chapters 1–11)

> Recovery + audit index. Chapters 3–7: `render-blueprint/` on branch `render-validator-agent-ch728`. Chapters 8–11: platform layer modules below.

## Chapter map

| Ch | Title | Sections | Module | Tests |
|----|-------|----------|--------|-------|
| 1 | Design Philosophy | overview | `docs/DESIGN-AI-v18-PHILOSOPHY.md` | via constitution |
| 2 | Blueprint | schema | `src/lib/render-blueprint/types.ts` | `render-blueprint.spec.ts` |
| 3 | Render Blueprint | 19 | `src/lib/render-blueprint/` | 21 specs |
| 4 | Agent Ecosystem | 28 | `src/lib/render-blueprint/` | 29 specs |
| 5 | Design Knowledge Engine | 20 | `src/lib/render-blueprint/` | 20 specs |
| 6 | Design Pipeline | 20 | `src/lib/render-blueprint/` | 21 specs |
| 7 | Platform Architecture | 28 | `src/lib/render-blueprint/` | 29 specs |
| **8** | **Design Knowledge Platform** | **27** | `src/lib/design-knowledge-platform/` | `design-knowledge-platform.spec.ts` |
| **9** | **Intelligent Orchestration Platform** | **19** | `src/lib/intelligent-orchestration-platform/` | `intelligent-orchestration-platform.spec.ts` |
| **10** | **Human AI Collaboration** | **15** | `src/lib/human-ai-collaboration/` | `human-ai-collaboration.spec.ts` |
| **11** | **Commercial Intelligence Platform** | **20** | `src/lib/commercial-intelligence-platform/` | 75 tests |

Registry: `src/lib/design-ai-book/book-registry.ts`

## Platform flow (8 → 11)

```
Ch8 Design Knowledge Platform
  → Ch9 Intelligent Orchestration Platform
  → Ch10 Human AI Collaboration
  → Ch11 Commercial Intelligence Platform
```

## Section registries

- Ch8: `design-knowledge-platform/sections.ts` — `8.1`–`8.27`
- Ch9: `intelligent-orchestration-platform/sections.ts` — `9.1`–`9.19`
- Ch10: `human-ai-collaboration/sections.ts` — `10.1`–`10.15`
- Ch11: `commercial-intelligence-platform/sections.ts` — `11.1`–`11.20`

## Verification

```bash
bash scripts/run-design-ai-book-audit.sh
```

## Status legend

| Status | Meaning |
|--------|---------|
| **full** | engine + types + spec (Ch11.18–11.20) |
| **registry** | section defined, implementation pending |
| **v18** | chapters 3–7 fully implemented on `ch728` |

Chapters 8–10 are **recovery scaffolds** — section catalog for audit; replace with hung-agent specs when available.
