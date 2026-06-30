# DESIGN AI v18 — Chapter 5.11: Typography Knowledge

## Purpose

Typography Knowledge contains professional knowledge about visual text representation in commercial infographics. Text is a composition element that strengthens product perception and information readability — not decorative overlay.

## Design Philosophy

Every text element answers: what to communicate, how fast it must be read, and what role it plays in the Story.

## Typography Knowledge Object

| Field | Role |
|-------|------|
| `rule` | Typography principle |
| `purpose` | Commercial/communication rationale |
| `recommendation` | Actionable guidance |
| `conditions` | Context matching |

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Readability first | `READABILITY_FIRST_PRINCIPLE` — readability over decoration |
| Text hierarchy | `TEXT_HIERARCHY_LEVELS` — headline → benefit → supporting → technical → notes |
| Font characters | `FONT_CHARACTER_GUIDANCE` — sans, serif, geometric, humanist, technical, display |
| Font weight | Bold (headline), medium (primary), regular (supporting); max 2 bold |
| Line spacing | 1.2–1.6 recommended range |
| Letter spacing | Premium tracking for luxury headlines |
| Alignment | Left/center/right — no random mixing |
| Text contrast | Uses Ch 5.10 `MIN_TEXT_CONTRAST_RATIO` (4.5) |
| Text density | Max ~35% text area; prefer concision |
| Style typography | Luxury, technical, lifestyle specific rules |
| Product priority | Text must not obscure hero product |
| Blueprint validation | `validateTypographyBlueprint()` — triggers retry |
| Evolution | `applyTypographyLearningFeedback()` |

## Golden Rule

Typography manages how quickly, in what order, and with what emotional effect information is perceived. Success means the main message is understood in the first seconds.

## Implementation

| Module | Role |
|--------|------|
| `typography-knowledge-types.ts` | Knowledge model, validation types |
| `typography-knowledge-engine.ts` | Rules, hierarchy, validation |

## Integration

Builds on Ch 5.10 Color Knowledge (contrast), Ch 5.7 Style Knowledge, Ch 5.8 Composition (text zones).

## Failure Conditions

Violated when:

- text is hard to read;
- hierarchy is missing;
- sizes are random;
- blocks are inconsistent;
- typography distracts from product.
