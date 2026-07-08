# DAOS Canonical Decision Language

## Purpose

The Constitution defines the laws.

The Organization Model defines ownership.

The Cognitive Architecture defines thinking.

The Runtime Specification defines execution.

This document defines the language used by DAOS during reasoning.

Every subsystem SHALL communicate using the same semantic model.

This language SHALL become the canonical communication protocol for all DAOS runtime components.

No subsystem SHALL invent its own terminology.

## Core Principle

DAOS components SHALL exchange decisions.

Not prompts.

Not implementation objects.

Not renderer-specific instructions.

Every runtime interaction SHALL be expressed as semantic commercial intent.

The Decision Language is the universal language of DAOS.

## Communication Rule

Every runtime stage SHALL consume semantic intent.

Every runtime stage SHALL produce semantic intent.

Implementation details SHALL remain local.

Only semantic meaning crosses subsystem boundaries.

## Canonical Decision Structure

Every decision SHALL contain:

- DecisionId
- DecisionType
- DecisionPurpose
- DecisionOwner
- DecisionConfidence
- DecisionEvidence
- DecisionConstraints
- DecisionPriority
- DecisionDependencies
- DecisionAlternatives
- DecisionRisks
- DecisionStatus
- DecisionVersion
- DecisionTimestamp
- DecisionConsumers
- DecisionDiagnostics

## Canonical Decision Types

Every decision SHALL use one of the following decision types:

- CommercialDecision
- KnowledgeDecision
- ResearchDecision
- ValidationDecision
- CompositionDecision
- SceneDecision
- LightingDecision
- TypographyDecision
- CameraDecision
- EnvironmentDecision
- BenchmarkDecision
- LearningDecision
- PromotionDecision
- GovernanceDecision

Every new decision type SHALL extend this model.

## Semantic Rules

Every decision SHALL answer:

- What is being decided?
- Why is it being decided?
- What evidence supports it?
- What constraints apply?
- What alternatives were rejected?
- What uncertainty remains?
- Who owns this decision?
- Who consumes this decision?
- How can this decision evolve?

## Decision Lifecycle

Every decision SHALL follow:

- Created
- Validated
- Approved
- Executed
- Measured
- Learned
- Archived

No decision SHALL bypass lifecycle stages.

## Cross-System Communication

The communication chain SHALL preserve semantic intent:

Commercial Genome

↓

Knowledge Resolution

↓

DecisionGraph

↓

SceneGraph

↓

Render Blueprint

↓

Renderer

↓

Benchmark

↓

Learning

↓

Research

All communication SHALL preserve semantic intent.

No subsystem may reinterpret commercial meaning without producing a new decision.

## Decision Invariants

Commercial meaning SHALL remain invariant.

Rendering SHALL NOT modify strategy.

SceneGraph SHALL NOT invent commercial intent.

Benchmark SHALL NOT mutate decisions.

Learning SHALL create proposals only.

Research SHALL create hypotheses only.

Governance SHALL approve evolution.

## Explainability

Every decision SHALL be explainable.

The runtime SHALL always answer:

- Why was this chosen?
- Why were alternatives rejected?
- Which evidence was used?
- Which knowledge participated?
- Which benchmark supported this?

Explainability is mandatory.

## Anti-Patterns

The following are prohibited:

- Hidden decisions
- Implicit decisions
- Prompt-only communication
- Module-specific terminology
- Undocumented semantic changes
- Silent decision mutation
- Duplicated decision ownership
- Context reconstruction

## Final Principle

DAOS does not communicate with prompts.

DAOS communicates with commercial decisions.

Prompts are only renderer adapters.

The canonical language of the platform is the Decision Language.

All runtime components SHALL use this language.

## Acceptance Criteria

The document is accepted only if:

- every runtime component can communicate using the same semantic model;
- commercial intent is preserved across all stages;
- decision ownership remains deterministic;
- explainability is guaranteed;
- no implementation-specific protocol becomes part of the architecture.

