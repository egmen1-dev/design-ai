# DESIGN AI v18 — Chapter 6.11: Consensus Validation Stage

## Purpose

Consensus Validation is the last intelligent check before render — it verifies all agent decisions form one coherent commercial concept.

## Design Philosophy

Individual agent decisions can each be correct yet contradict each other. Design AI treats the image as a unified system requiring collective agreement.

## Responsibilities

| Area | Output |
|------|--------|
| Layer validation | business, story, scene, composition, photography, marketplace, knowledge scores |
| Conflict graph | `PlannedConsensusConflict[]` |
| Consensus score | `PlannedConsensusReport.overallScore` |
| Retry planning | `retryTargets` — minimal localized reruns |
| Approval | `approved` / `retry_required` / `inconsistent` |

Consensus Validation evaluates — it never creates design decisions.

## Planned Consensus Report

`PlannedConsensusReport` implements the chapter spec `ConsensusReport`.

## Key APIs

| API | Role |
|-----|------|
| `computeLayerScores()` | Seven independent validation layers |
| `detectPlanningLayerConflicts()` | Assembly + planning conflicts |
| `buildPlannedConsensusReport()` | Score, status, recommendations |
| `runConsensusValidationStage()` | Full stage + Ch 4.23 engine bridge |
| `enrichPipelineContextWithConsensusValidation()` | Validation context patch |
| `runConsensusValidationStageFromPipeline()` | Assembly → consensus chain |

## Integration

- Ch 6.10 assembled `RenderBlueprint`
- Ch 4.23 `buildConsensusReport()` / consensus-engine
- Ch 6 `executeDesignPipelineStage(CONSENSUS_VALIDATION)`
- Render Adapter (downstream, approved only)

## Golden Rule

All agents must be ready to jointly sign off before generation begins.

## Failure Conditions

Violated when conflicts appear only after render, business goal is ignored, retry is unnecessary, or approval lacks explainability.
