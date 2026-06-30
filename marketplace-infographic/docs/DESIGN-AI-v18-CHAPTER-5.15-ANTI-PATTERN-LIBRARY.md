# DESIGN AI v18 — Chapter 5.15: Anti-Pattern Library

## Purpose

Anti-Pattern Library is a centralized library of typical design mistakes that harm commercial infographic perception, reduce trust, and lower purchase probability. Pattern Library answers "what to do"; Anti-Pattern Library answers "what to avoid."

## Design Philosophy

AI systems reproduce mistakes as easily as good solutions. Professional design requires knowing good decisions, bad decisions, why errors occur, and how to prevent them.

## Design Anti-Pattern Object

| Field | Role |
|-------|------|
| `name` | Anti-pattern name |
| `category` | Error domain |
| `description` | Why it hurts conversion |
| `severity` | critical / major / minor / info |
| `detectionRules` | Automatic detection rules |
| `recommendedFixes` | Auto-recovery guidance |
| `confidence` | Detection confidence |

`DesignAntiPattern` is distinct from Ch 5.8 `CompositionAntiPattern`.

## Categories

- Business — missing USP, hero, commercial focus
- Composition — missing hero, competing foci, overcrowding
- Photography — impossible lighting, wrong shadows, AI artifacts
- Typography — excessive text, low contrast, chaotic alignment
- Marketplace — rule violations, thumbnail readability, safe zones
- Psychology — info overload, visual noise, emotional conflict
- Rendering — deformed geometry, duplicates, AI noise

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Severity actions | `SEVERITY_ACTIONS` — critical reject, major retry, minor correct |
| Detection | `detectDesignAntiPatterns()` — rule-based automatic detection |
| Hero area rule | Hero product area &lt; 25% → Critical |
| Text contrast | Contrast &lt; Ch 5.10 `MIN_TEXT_CONTRAST_RATIO` → Major |
| Auto recovery | `recommendAntiPatternFixes()` — feeds Retry Architecture |
| Blueprint validation | `validateAntiPatternBlueprint()` — reject/retry flags |
| Learning | `applyAntiPatternLearningFeedback()` — Design Memory integration |
| Pre-generation | Detection runs before blueprint publication |

## Golden Rule

Professional design is defined by mistakes avoided. Pattern Library teaches good images; Anti-Pattern Library teaches how never to create bad ones again.

## Implementation

| Module | Role |
|--------|------|
| `anti-pattern-library-types.ts` | Anti-pattern model, severity, validation types |
| `anti-pattern-library-engine.ts` | 25 seed anti-patterns, detection, validation |

## Integration

Builds on Ch 5.14 Pattern Library, Ch 5.10 Color (contrast), Ch 5.12 Cognitive Psychology (cognitive load, hero ratio), Ch 5.8 Composition anti-patterns.

## Failure Conditions

Violated when:

- errors detected only after generation;
- severity is not classified;
- auto-fix cannot be recommended;
- same errors repeat without Design Memory link.
