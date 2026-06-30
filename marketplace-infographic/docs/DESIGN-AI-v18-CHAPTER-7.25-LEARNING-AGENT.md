# DESIGN AI v18 — Chapter 7.25: Learning Agent

## Purpose

Learning Agent is the main self-learning mechanism of the Design AI Platform. While prior agents create, analyze, evaluate, and approve projects, Learning Agent answers a different question: **"What should the system learn from this completed project?"**

## Mission

Improve all future projects — not the current one. Transform successful decisions, errors, retry outcomes, user feedback, and real CTR metrics into knowledge that gradually improves the entire Agent Ecosystem.

## Module

Implemented as `learning-agent-*`, post-generation learning layer.

| File | Role |
|------|------|
| `learning-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `learning-agent-engine.ts` | Agent runner, pattern discovery, failure analysis, memory updates |
| `learning-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Experience Collector
2. Pattern Discovery
3. Failure Analysis
4. Knowledge Evolution
5. Memory Updater
6. Learning Validator
7. Learning Package Builder

## Pipeline Position

```text
Chief Design Director → Render Pipeline → User Feedback → Analytics → Learning Agent → Knowledge Engine
```

Learning Agent never interferes with the current generation. It works only with completed projects.

## Key APIs

| API | Role |
|-----|------|
| `executeLearningAgent()` | Full agent execution with modules + rare retry |
| `buildBatterySprayerLearningInput()` | Garden sprayer kitchen fixture with full project package |
| `discoverLearningPatterns()` | Detect successful recurring design combinations |
| `fromLearningPackageSection()` | Spec-compliant LearningPackage output |
| `validateLearningAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 7.24 `chief-design-director-agent` — FinalDesignDecision input
- Ch 7.23 `senior-art-director-agent` — ArtDirectorReport input
- Ch 7.22 `commercial-critic-agent` — CommercialReport input
- Ch 7.21 `vision-critic-agent` — VisionReport input
- Ch 5.14 `pattern-library` — Pattern proposals
- Ch 5.15 `anti-pattern-library` — Anti-pattern proposals
- Ch 4.20 `design-memory` — Memory record updates
- Ch 7.6 `agent-professional-decision` — learning analysis validation

## Golden Rule

A good AI system generates; an excellent AI system learns. Learning Agent ensures every completed generation makes the entire platform a little smarter than yesterday.
