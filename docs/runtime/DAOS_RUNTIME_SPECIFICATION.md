# DAOS Runtime Specification

## 1. Runtime Purpose

DAOS runtime SHALL convert a generation request into:

1. A commercial decision that selects the best-fit strategy for a specific product, marketplace, audience, and goal.
2. A visual scene that encodes that commercial decision as canonical design state.
3. A rendered candidate that materializes the planned scene into an inspectable artifact.
4. Benchmarkable evidence that supports learning and governed feedback.

The runtime model SHALL express runtime reasoning only. It SHALL NOT describe implementation, programming constructs, module wiring, file organization, or provider APIs.

## 2. Runtime Invariants

The runtime SHALL obey the following invariants:

- GenerationContext is immutable after initialization.
- Commercial Genome is read-only during generation.
- Knowledge Resolution happens before DecisionGraph.
- DecisionGraph is immutable after publication.
- SceneGraph is the only scene state.
- Rendering cannot change commercial intent.
- Benchmark cannot change production state.
- Learning creates proposals, not silent mutations.

In addition, every stage SHALL obey the ordering boundary:

- No stage may skip another stage.
- No stage may access future stages.
- No stage may mutate previous stages.

## 3. Runtime Pipeline Overview

DAOS runtime SHALL be described as a **Commercial Decision Cycle**, not only as a sequence of technical stages.

The technical stages in this specification implement the canonical cycle below. No stage exists outside this cycle.

Context

↓

Understand

↓

Reason

↓

Decide

↓

Plan

↓

Validate

↓

Execute

↓

Measure

↓

Learn

↓

Improve

This cycle is canonical.

### Phase Mapping

Every Runtime stage belongs to exactly one decision phase:

- Context
  - Runtime Entry
  - GenerationContext Initialization
- Understand
  - Commercial Genome Loading
  - Knowledge Resolution
- Reason
  - Commercial Reasoning
- Decide
  - DecisionGraph Construction
- Plan
  - SceneGraph Construction
  - Render Preparation
- Validate
  - Commercial Validation
- Execute
  - Rendering
- Measure
  - Post Render Validation
  - Commercial Benchmark
- Learn
  - Learning
  - Genome Feedback Proposal
- Improve
  - Research Feedback Proposal

No stage may be skipped. If any stage fails, the generation run SHALL terminate according to the Runtime Failure Model.

### Architectural Rule (Decision-Phase Questioning)

Every Runtime stage SHALL answer one question only:

- Context: What problem am I solving?
- Understand: What do I know?
- Reason: What should I do?
- Decide: What will I do?
- Plan: How will I do it?
- Validate: Is it good enough?
- Execute: Can it be produced?
- Measure: How well did it perform?
- Learn: What did I discover?
- Improve: What should be researched next?

## 4. Stage 0 — Runtime Entry

Purpose
Describe how a generation request enters DAOS.

Inputs
- User Request

Processing
- Validate that the User Request can be normalized into a single generation identity and a complete commercial intent.
- Verify that the request specifies the target product identity, marketplace context, and commercial goal.
- Determine the runtime operating mode for this generation.
- Emit a deterministic generationContextId for diagnostics.

Outputs
- Generation Request

Invariants
- Runtime Entry SHALL perform no commercial reasoning.
- Runtime Entry SHALL not access Commercial Genome or any resolved knowledge.

Failure Conditions
- The request is structurally incomplete for context initialization.
- The request cannot be bound to a product, marketplace, and commercial goal.
- The request operating mode is invalid or unknown.

Diagnostics
- generationContextId
- Request validationResults summary
- Rejected input fields with reasons

Transition Rule
- On success: proceed to Stage 1.
- On failure: terminate the generation run immediately.

Next Stage
Stage 1 — GenerationContext Initialization

## 5. Stage 1 — GenerationContext Initialization

Purpose
Create the canonical GenerationContext. The context becomes immutable.

Inputs
- Generation Request

Processing
- Construct GenerationContext as the single source of truth for the generation.
- Populate GenerationContext domains for:
  - product identity and attributes
  - marketplace, category, audience, brand
  - commercial goal and operating mode
  - design intent, constraints, and required asset/provider context
  - rendering, benchmarking, and learning context needed for later stages
- Validate internal consistency within GenerationContext.
- Freeze GenerationContext so it cannot change for the remainder of the generation run.

Outputs
- GenerationContext

Invariants
- GenerationContext SHALL be immutable after initialization.
- No later stage may reconstruct, override, or partially replace GenerationContext.

Failure Conditions
- Any required GenerationContext domain is missing.
- GenerationContext contains contradictions that prevent safe downstream evaluation.

Diagnostics
- generationContextId
- genomeVersion is not set yet (Stage 2 not executed) but dependencies summary is recorded
- resolvedKnowledgeSummary is not set yet (Stage 3 not executed)
- sceneGraphTrace is not set yet
- initializationResults summary

Transition Rule
- On success: proceed to Stage 2.
- On failure: terminate the generation run immediately.

Next Stage
Stage 2 — Commercial Genome Loading

## 6. Stage 2 — Commercial Genome Loading

Purpose
Load only production-approved commercial knowledge.

Inputs
- GenerationContext

Processing
- Determine which Commercial Genome corpus is eligible for this generation and operating mode.
- Production mode SHALL load only certified/stable knowledge.
- Experimental knowledge SHALL NOT affect production reasoning.
- Research candidates SHALL be isolated from production reasoning until governed promotion occurs outside this runtime run.
- Coarsely filter knowledge by GenerationContext eligibility boundaries to create a production-eligible snapshot.
- Record excluded knowledge as ignoredKnowledge.

Outputs
- Commercial Genome Snapshot
- IgnoredKnowledge (coarse exclusions)

Invariants
- Commercial Genome SHALL be read-only during the generation run.
- This stage SHALL not resolve conflicts, rank, or decide commercial strategy.

Failure Conditions
- No production-eligible knowledge can be loaded for the generation.
- The Commercial Genome Snapshot cannot be constructed due to integrity or eligibility failures.

Diagnostics
- generationContextId
- genomeVersion
- ignoredKnowledge summary

Transition Rule
- On success: proceed to Stage 3.
- On failure: terminate the generation run immediately.

Next Stage
Stage 3 — Knowledge Resolution

## 7. Stage 3 — Knowledge Resolution

Purpose
Resolve only knowledge applicable to the current product.

Inputs
- GenerationContext
- Commercial Genome Snapshot

Processing
- Apply the governed resolution pipeline in order to transform the snapshot into a ResolvedKnowledgeSet.
- Apply conflict resolution governed by precedence rules.
- Activate AntiRule semantics so known commercial failures are explicitly eliminated from downstream reasoning.
- Record:
  - ignoredKnowledge (any knowledge excluded during resolution)
  - conflictReport (what conflicted, how it was resolved, and what was suppressed)

Outputs
- ResolvedKnowledgeSet
- IgnoredKnowledge (resolution exclusions)
- ConflictReport

Invariants
- Knowledge Resolution SHALL occur before DecisionGraph construction.
- Decision Engine SHALL never consume raw Commercial Genome snapshot directly.
- Resolution SHALL produce a mode-eligible, reasoning-ready knowledge set.

Failure Conditions
- ResolvedKnowledgeSet is empty after mandatory filters and governed AntiRule elimination.
- Conflict resolution cannot produce a governed outcome.

Diagnostics
- generationContextId
- resolvedKnowledgeSummary
- ignoredKnowledge summary
- conflictReport summary

Transition Rule
- On success: proceed to Stage 4.
- On failure: terminate the generation run immediately.

Next Stage
Stage 4 — Commercial Reasoning

## 8. Stage 4 — Commercial Reasoning

Purpose
Answer one question:
What is the best commercial strategy for THIS product?

This stage SHALL NOT think about images or rendering.
It SHALL think about selling.

Inputs
- ResolvedKnowledgeSet
- GenerationContext

Processing
- Determine the product value proposition implied by GenerationContext.
- Select the single coherent commercial strategy that is:
  - internally consistent across commercial decision domains
  - evidence-backed by the ResolvedKnowledgeSet
  - compliant with constraints and AntiRule semantics
- Reject any strategy that fails commercial evidence thresholds or introduces incoherence.

Outputs
- Commercial Strategy

Invariants
- Commercial Reasoning SHALL produce exactly one strategy (Production) or isolated candidates only if operating mode requires isolation.
- Rendering cannot change commercial intent; this stage defines the intent.

Failure Conditions
- No viable commercial strategy remains after rejection.
- Inter-domain coherence cannot be achieved under governed rules.

Diagnostics
- generationContextId
- decisionTrace summary (strategy selection trace)
- rejectedAlternatives summary (top rejected strategies or key rejections)

Transition Rule
- On success: proceed to Stage 5.
- On failure: terminate the generation run immediately.

Next Stage
Stage 5 — DecisionGraph Construction

## 9. Stage 5 — DecisionGraph Construction

Purpose
Transform Commercial Strategy into deterministic commercial decisions.

Inputs
- Commercial Strategy
- ResolvedKnowledgeSet

Processing
- Encode the selected commercial strategy into a deterministic DecisionGraph structure.
- Populate decision domains required for commercial authority:
  - HeroDecision
  - TypographyDecision
  - SceneDecision
  - CompositionDecision
  - LightingDecision
  - OverlayDecision
  - CameraDecision
  - EnvironmentDecision
- Validate DecisionGraph structural completeness and internal consistency.
- Publish DecisionGraph as immutable commercial authority.

Outputs
- DecisionGraph

Invariants
- DecisionGraph SHALL be immutable after publication.
- DecisionGraph Construction SHALL not alter the meaning of GenerationContext.
- Knowledge Resolution outputs SHALL not be re-derived from within this stage.

Failure Conditions
- DecisionGraph is incomplete or structurally invalid.
- Published DecisionGraph fails internal consistency checks.

Diagnostics
- generationContextId
- decisionTrace summary
- decisionGraphTrace summary (structural completeness and validations)

Transition Rule
- On success: proceed to Stage 6.
- On failure: terminate the generation run immediately.

Next Stage
Stage 6 — SceneGraph Construction

## 10. Stage 6 — SceneGraph Construction

Purpose
Transform deterministic decisions into canonical planned scene design state.

Inputs
- DecisionGraph
- GenerationContext

Processing
- Translate DecisionGraph into scene-structured design intent.
- Populate SceneGraph.planned as the canonical design state.
- Ensure SceneGraph is the only authoritative representation of the planned scene for later validation.

Outputs
- SceneGraph.planned

Invariants
- SceneGraph is the only scene state.
- SceneGraph Construction SHALL not render.

Failure Conditions
- SceneGraph.planned cannot be mapped from DecisionGraph.
- Planned scene violates SceneGraph invariants.

Diagnostics
- generationContextId
- sceneGraphTrace summary (planned structure inventory and validation)

Transition Rule
- On success: proceed to Stage 7.
- On failure: terminate the generation run immediately.

Next Stage
Stage 7 — Commercial Validation

## 11. Stage 7 — Commercial Validation

Purpose
Reject weak commercial solutions before rendering.

Inputs
- SceneGraph.planned
- DecisionGraph
- ResolvedKnowledgeSet

Processing
- Validate commercial quality of the planned scene against governed checks:
  - Hero dominance
  - One main message
  - Hierarchy
  - Visual noise
  - Thumbnail readability
  - Grammar
  - Commercial psychology
- Validate that planned scene satisfies hard constraints implied by GenerationContext and AntiRule semantics.
- Produce either a validated or rejected planned scene.

Outputs
- ValidatedSceneGraph
- RejectedSceneGraph

Invariants
- This stage SHALL not render.
- Rejected planned scenes SHALL not proceed to render preparation.

Failure Conditions
- Planned scene fails one or more mandatory commercial validation checks.

Diagnostics
- generationContextId
- validationResults summary
- rejectedAlternatives summary (rejected planned scenes and key failing checks)

Transition Rule
- On pass: proceed to Stage 8.
- On rejection: terminate the generation run immediately or switch to permitted exploration isolation rules if operating mode explicitly allows it.

Next Stage
Stage 8 — Render Preparation

## 12. Stage 8 — Render Preparation

Purpose
Prepare executable render instructions. DAOS still does not make commercial decisions here.

Inputs
- ValidatedSceneGraph

Processing
- Translate validated planned design into a Render Blueprint.
- Ensure Render Blueprint is a projection of validated decisions and does not reinterpret commercial intent.
- Ensure Render Blueprint is incapable of changing the commercial strategy.
- Bind Render Blueprint to the rendering context required by GenerationContext.

Outputs
- Render Blueprint

Invariants
- Render Preparation SHALL NOT change commercial decisions.
- Render Blueprint SHALL be derived from the validated planned scene only.

Failure Conditions
- Render Blueprint cannot be constructed from validated scene.
- Render Blueprint projection integrity fails.

Diagnostics
- generationContextId
- sceneGraphTrace summary (validated planned scene linkage)
- blueprintTrace summary

Transition Rule
- On success: proceed to Stage 9.
- On failure: terminate the generation run immediately.

Next Stage
Stage 9 — Rendering

## 13. Stage 9 — Rendering

Purpose
Render the prepared blueprint into an inspectable candidate artifact.

Inputs
- Render Blueprint

Processing
- Execute the Render Blueprint to materialize the planned scene into an actual rendered candidate.
- Update SceneGraph.actual only as a governed manifestation of the Render Blueprint.

Outputs
- Rendered Candidate

Invariants
- Rendering cannot change commercial intent.
- Rendering SHALL not modify DecisionGraph or GenerationContext.
- SceneGraph is the only scene state: planned and actual are owned by SceneGraph.

Failure Conditions
- Render execution failure.
- Governed SceneGraph.actual mutation invariants violated.

Diagnostics
- generationContextId
- decisionTrace summary references (what DecisionGraph governed)
- sceneGraphTrace updated with actual-state linkage
- renderResults summary

Transition Rule
- On success: proceed to Stage 10.
- On failure: terminate the generation run immediately.

Next Stage
Stage 10 — Post Render Validation

## 14. Stage 10 — Post Render Validation

Purpose
Evaluate commercial quality, rendering fidelity, and benchmark suitability.

Inputs
- Rendered Candidate
- SceneGraph.actual
- DecisionGraph

Processing
- Validate:
  - product dominance
  - overlay readability
  - contrast
  - composition
  - marketplace quality
  - commercial quality
- Confirm rendered candidate matches the published commercial intent encoded in DecisionGraph.
- Produce a validated or rejected candidate.

Outputs
- ValidatedCandidate
- RejectedCandidate

Invariants
- Post Render Validation SHALL occur before benchmark evidence is produced.
- Benchmark suitability SHALL only be computed for validated candidates.

Failure Conditions
- Candidate fails mandatory fidelity or commercial quality validations.
- Governance evaluation fails in Production mode.

Diagnostics
- generationContextId
- validationResults summary (validated vs rejected)
- rejectedAlternatives summary (key failing checks)

Transition Rule
- On validated: proceed to Stage 11.
- On rejected: terminate the generation run immediately or produce permitted exploration artifacts only if explicitly allowed by operating mode.

Next Stage
Stage 11 — Commercial Benchmark

## 15. Stage 11 — Commercial Benchmark

Purpose
Measure commercial performance.

Inputs
- ValidatedCandidate

Processing
- Measure quality using governed benchmark criteria derived from the generation context and validated scene/candidate.
- Compute performance metrics and evidence comparisons.
- Produce a Benchmark Report for learning and feedback proposal generation.

Outputs
- Benchmark Report

Invariants
- Benchmark cannot change production state.
- Benchmark does not modify DecisionGraph, SceneGraph, or Commercial Genome during the generation run.

Failure Conditions
- Benchmark suite or required measurements are unavailable.
- Benchmark integrity checks fail.

Diagnostics
- generationContextId
- benchmarkSummary

Transition Rule
- On success: proceed to Stage 12.
- On failure: terminate the generation run immediately.

Next Stage
Stage 12 — Learning

## 16. Stage 12 — Learning

Purpose
Learn only from validated benchmark evidence.

Inputs
- Benchmark Report
- Historical Results

Processing
- Determine which knowledge confidence adjustments are warranted by benchmark evidence.
- Generate Learning Events that are evidence-backed and traceable.
- Learning creates proposals, not silent mutations; no direct genome mutation occurs here.

Outputs
- Learning Events

Invariants
- Learning mutates neither DecisionGraph nor SceneGraph.
- Learning does not mutate completed generations.

Failure Conditions
- Evidence is insufficient to justify confidence changes under governed thresholds.
- Learning policy prohibits adjustment.

Diagnostics
- generationContextId
- learningEvents summary

Transition Rule
- On success: proceed to Stage 13.
- On failure: proceed with a minimal, empty, or no-change Learning Events set according to governed policy, then proceed to Stage 13.

Next Stage
Stage 13 — Genome Feedback Proposal

## 17. Stage 13 — Genome Feedback Proposal

Purpose
Determine whether genome knowledge should change.

Inputs
- Learning Events
- Benchmark Report

Processing
- Convert Learning Events into a Genome Update Proposal.
- The proposal SHALL contain governance-ready change candidates and rationale.
- The proposal SHALL not directly mutate the genome during runtime.

Outputs
- Genome Update Proposal

Invariants
- This stage SHALL not mutate Commercial Genome during the generation run.
- Genome Update Proposal is traceable to learning evidence.

Failure Conditions
- Learning Events cannot be transformed into a valid governance proposal set.

Diagnostics
- generationContextId
- genomeUpdateProposalTrace summary

Transition Rule
- On success: proceed to Stage 14.
- On failure: terminate the generation run with diagnostics; research feedback may still be emitted if governed policy permits it.

Next Stage
Stage 14 — Research Feedback Proposal

## 18. Stage 14 — Research Feedback Proposal

Purpose
Determine whether new research should begin.

Inputs
- Failures
- Rejected Candidates
- Benchmark Gaps

Processing
- Identify failure patterns that indicate missing or insufficient commercial knowledge.
- Convert gaps into a Research Proposal and associated artifacts:
  - Knowledge Candidate: what knowledge should be explored or refined
  - AntiRule Candidate: what must be rejected next time to prevent repeated failure patterns
- Explain negative knowledge explicitly: failed experiments create useful negative knowledge by turning repeated failure into governed rejection constraints.

Outputs
- Research Proposal
- Knowledge Candidate
- AntiRule Candidate

Invariants
- Research Feedback Proposal SHALL not mutate production knowledge directly within this runtime run.
- Emitted artifacts SHALL be traceable to failures, rejected candidates, and benchmark gaps.

Failure Conditions
- Research artifacts cannot be structured under governed research entry constraints.

Diagnostics
- generationContextId
- rejectedAlternatives summary (failure pattern keys)
- researchFeedbackTrace summary

Transition Rule
- On success: terminate the generation run.
- On failure: terminate the generation run with diagnostics.

Next Stage
None

## 19. Runtime Failure Model

When a stage fails, DAOS SHALL follow the failure model below:

- Fail early when context is invalid.
- Reject unresolved knowledge conflicts.
- Reject incomplete DecisionGraph.
- Reject weak SceneGraph before rendering.
- Reject poor render after validation.
- Create Finding, not hidden retry.

The generation run terminates immediately upon any hard failure condition, except where operating mode explicitly allows permitted exploration isolation artifacts.

## 20. Runtime Diagnostics

Every generation MUST produce the following diagnostics fields:

- generationContextId
- genomeVersion
- resolvedKnowledgeSummary
- decisionTrace
- sceneGraphTrace
- validationResults
- benchmarkSummary
- learningEvents
- ignoredKnowledge
- rejectedAlternatives

Diagnostics MUST be complete enough to reconstruct the full runtime reasoning chain without re-running any stage.

## 21. Runtime Anti-Patterns

DAOS runtime SHALL explicitly prohibit:

- prompt-first generation
- rendering before decision
- raw Genome access by renderer
- commercial rules inside templates
- hidden retry loops
- patch replacing root-cause fix
- benchmark changing production state
- learning mutating completed generations

Any implementation that violates these runtime anti-patterns SHALL be considered non-compliant.

## 22. Final Principle

DAOS thinks before it renders.
DAOS decides before it composes.
DAOS validates before it learns.
DAOS learns only from evidence.

