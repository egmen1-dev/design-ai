# DAOS Engineering Playbook

**Version:** 1.0  
**Status:** Canonical  
**Normative:** Mandatory  

**Applies to:** All DAOS contributors · Cursor · AI Agents · Human Engineers

---

# 1. Purpose

This document defines the engineering process for evolving DAOS.

Its objective is to prevent architectural entropy while continuously improving commercial intelligence.

The Playbook is derived from:

- [DAOS Constitution V3](../architecture/DAOS_ARCHITECTURE_CONSTITUTION_V3.md)
- Architecture Audit
- Wave 1–34
- [Experimental Knowledge Base](../architecture/DAOS_EXPERIMENTAL_KNOWLEDGE_BASE.md)
- Commercial Genome roadmap

---

# 2. Primary Engineering Principle

Every engineering decision SHALL increase one or more of:

- architectural consistency
- commercial intelligence
- determinism
- explainability
- maintainability

Every engineering decision SHALL decrease one or more of:

- duplicated logic
- duplicated metrics
- architectural entropy
- temporary code
- technical debt

---

# 3. Engineering Order

Every feature SHALL follow this sequence.

```text
Problem

↓

Research

↓

Evidence

↓

Experiment

↓

Knowledge

↓

Architecture

↓

Implementation

↓

Benchmark

↓

Production
```

Implementation SHALL NEVER be the first step.

---

# 4. Root Cause Rule

Engineers SHALL identify the root cause before writing code.

Incorrect process:

```text
Problem

↓

Patch

↓

Patch

↓

Patch
```

Correct process:

```text
Problem

↓

Root Cause

↓

Architecture

↓

Implementation
```

---

# 5. Knowledge Before Code

If a problem can be solved by improving Commercial Genome,

Commercial Genome SHALL be updated.

Code SHALL NOT compensate for missing commercial knowledge.

---

# 6. Existing Module First

Before introducing a new subsystem:

Engineers SHALL evaluate:

```text
Existing Module

↓

Existing Plugin

↓

Existing Agent

↓

Existing Protocol

↓

New Module
```

Creating a new module SHALL be the final option.

---

# 7. Single Owner Rule

Every concept SHALL have one owner.

Examples:

Decision → DecisionGraph

Scene → SceneGraph

Knowledge → Commercial Genome

State → State Machine

Events → Event Bus

Metrics → Metric Registry

---

# 8. No Duplicate Metrics

Every metric SHALL be calculated exactly once.

Consumers SHALL reuse existing metrics.

Creating another implementation of the same metric is prohibited.

---

# 9. No Hidden Knowledge

Commercial heuristics SHALL NOT exist in source code.

Examples of forbidden constructs:

```text
if yellow then green background

if drill then industrial scene

if battery then blue lighting
```

Such knowledge SHALL exist only inside Commercial Genome.

---

# 10. Rule Promotion

Commercial knowledge SHALL evolve.

Lifecycle:

```text
Idea

↓

Experiment

↓

Evidence

↓

Knowledge Candidate

↓

Benchmark

↓

Certified Rule

↓

Commercial Genome
```

Direct insertion into Commercial Genome is prohibited.

---

# 11. Rule of One Change

Every refinement iteration SHALL modify exactly one commercial parameter.

Examples:

- background
- headline
- layout
- lighting
- hero size
- spacing

Only one parameter may change.

---

# 12. Architecture Before Optimization

Correct order:

```text
Architecture

↓

Correctness

↓

Benchmark

↓

Optimization
```

Premature optimization is prohibited.

---

# 13. Benchmark Driven Development

Every architectural modification SHALL be benchmarked.

Benchmark SHALL compare:

```text
Baseline

↓

Candidate

↓

Delta

↓

Regression

↓

Decision
```

Implementation without benchmark SHALL NOT enter Production.

---

# 14. Experimental Features

Every experimental subsystem SHALL define:

- Feature Flag
- Owner
- Benchmark
- Removal Criteria
- Exit Strategy

Experimental features SHALL NOT remain indefinitely.

---

# 15. Patch Policy

Allowed:

- Migration Patch
- Compatibility Patch
- Experimental Patch

Forbidden:

- Permanent Patch
- Permanent Hook
- Permanent Bridge

Every patch SHALL have a removal strategy.

---

# 16. Refactoring Budget

Every development cycle SHALL remove technical debt.

Examples:

- duplicate metrics
- duplicate logic
- duplicate calculations
- unused adapters
- obsolete bridges
- deprecated hooks

Growth without cleanup is prohibited.

---

# 17. Documentation Rule

Every architectural change SHALL update:

- ADR
- RFC
- Benchmark
- Knowledge Base

Documentation SHALL evolve with implementation.

---

# 18. Knowledge Base Priority

Experimental Knowledge Base SHALL be considered the primary source of commercial discoveries.

Commercial Genome SHALL consume only validated knowledge.

Knowledge SHALL NOT be inferred without evidence.

---

# 19. Human Review

Promotion to Production requires:

- Architecture validation
- Benchmark validation
- Knowledge validation
- Human approval

Automatic promotion is prohibited.

---

# 20. Engineering Philosophy

DAOS is engineered as a Commercial Decision Operating System.

Image generation is one execution backend.

Commercial reasoning is the core product.

Everything else exists to execute those decisions.

---

**END OF DOCUMENT**
