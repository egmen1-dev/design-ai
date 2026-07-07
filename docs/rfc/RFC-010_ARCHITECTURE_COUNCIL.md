# RFC-010 — DAOS Architecture Council Protocol

**Status:** Draft (Proposed)  
**Layer:** Architecture Governance  
**Normative:** Mandatory  

Related: [DAOS Constitution V3](../architecture/DAOS_ARCHITECTURE_CONSTITUTION_V3.md) · [Engineering Playbook](../engineering/DAOS_ENGINEERING_PLAYBOOK.md) · [Cursor Engineering Kernel](../engineering/CURSOR_ENGINEERING_KERNEL.md) · [Pre-Implementation Review](../engineering/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md)

---

# 1. Purpose

The Architecture Council is the canonical architectural decision protocol of DAOS.

The Council SHALL NOT be implemented as a collection of AI agents.

The Council SHALL be implemented as a deterministic review pipeline.

Its purpose is to transform implementation requests into validated architectural specifications.

---

# 2. Principle

Implementation SHALL NEVER begin immediately after receiving a request.

Every request SHALL first become an Architecture Proposal.

```text
User Request

↓

Architecture Proposal

↓

Council Review

↓

Implementation Specification

↓

Code Generation
```

---

# 3. Council Inputs

The Council consumes:

```yaml
UserRequest

CommercialGenome

ExperimentalKnowledge

ArchitectureConstitution

EngineeringPlaybook

CurrentArchitectureState

ExistingProtocols

ExistingPlugins

ExistingMetrics

ExistingObjects
```

---

# 4. Council Outputs

The Council produces:

```yaml
ArchitectureDecision

ArchitecturalCost

AffectedObjects

RequiredRFC

RequiredADR

MigrationPlan

BenchmarkPlan

ImplementationSpecification
```

The Council SHALL NEVER produce source code.

---

# 5. Review Pipeline

Every proposal SHALL pass the following stages.

```text
Stage 1

Problem Definition

↓

Stage 2

Root Cause Analysis

↓

Stage 3

Knowledge Review

↓

Stage 4

Architecture Review

↓

Stage 5

Ownership Review

↓

Stage 6

Complexity Analysis

↓

Stage 7

Benchmark Planning

↓

Stage 8

Implementation Specification
```

Skipping stages is prohibited.

---

# 6. Root Cause Review

The Council SHALL determine whether the problem originates from:

```yaml
Knowledge

Architecture

Protocol

Implementation

Benchmark

Configuration

Provider

External System
```

Only after root cause identification MAY implementation continue.

---

# 7. Knowledge Review

The Council SHALL determine whether the requested behavior already exists inside:

```yaml
Commercial Genome

Experimental Knowledge Base

Research Results

Benchmark History
```

If existing knowledge solves the problem:

Implementation SHALL be rejected.

Knowledge SHALL be reused.

---

# 8. Ownership Review

Every affected object SHALL have one canonical owner.

The Council SHALL reject:

- duplicate ownership
- duplicate metrics
- duplicate calculations
- duplicate state
- duplicate commercial rules

---

# 9. Complexity Review

The Council SHALL estimate:

```yaml
New Objects

New Plugins

New Dependencies

New State

New Metrics

New Knowledge

New Protocols

Architectural Entropy
```

---

# 10. Architectural Cost

Every proposal SHALL receive an Architectural Cost Report.

Example:

```yaml
ArchitecturalCost:

complexityDelta: 4

newObjects: 1

newMetrics: 0

newProtocols: 0

newDependencies: 1

entropyDelta: -2

maintainability: +8

futureExtensibility: +12

overallScore: 94
```

---

# 11. Decision

The Council SHALL choose one of:

```yaml
Approve

Approve With Refactoring

Request RFC

Request ADR

Reject

Request Experiment

Request Benchmark
```

Only approved proposals MAY continue.

---

# 12. Implementation Specification

The final output SHALL contain:

```yaml
Affected Files

Affected Objects

Protocols

Migration Order

Expected Metrics

Acceptance Criteria

Rollback Strategy

Benchmark Plan
```

Implementation SHALL follow this specification exactly.

---

# 13. Guiding Principle

The Architecture Council is a protocol.

It is not an AI agent.

It is not a plugin.

It is not a subsystem.

It is the mandatory engineering process that precedes every architectural modification.
