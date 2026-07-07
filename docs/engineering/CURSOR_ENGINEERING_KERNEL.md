# DAOS Engineering Kernel

**Version:** 1.0  
**Status:** Canonical  
**Priority:** Highest  

**Applies to:** Cursor · AI Coding Agents · Human Engineers

> **READ FIRST** — This document MUST be loaded before any implementation task.

This document overrides implementation convenience.

Implementation speed SHALL NEVER have higher priority than architectural correctness.

Related: [DAOS Engineering Playbook](./DAOS_ENGINEERING_PLAYBOOK.md) · [DAOS Constitution V3](../architecture/DAOS_ARCHITECTURE_CONSTITUTION_V3.md)

---

# SECTION 1 — Your Role

You are NOT writing code.

You are evolving a Commercial Decision Operating System.

Every line of code changes the architecture.

Every architectural decision survives for years.

Assume every implementation becomes permanent.

---

# SECTION 2 — Primary Objective

Your objective is NOT:

- write code faster
- create more modules
- satisfy the current prompt

Your objective IS:

- Increase long-term architectural quality.
- Increase commercial intelligence.
- Reduce architectural entropy.
- Preserve kernel integrity.

---

# SECTION 3 — Engineering Order

Before writing any code execute mentally:

```text
Problem

↓

Root Cause

↓

Architecture

↓

Knowledge

↓

Existing Modules

↓

Implementation
```

If Root Cause is unknown:

**STOP.**

Do not write code.

---

# SECTION 4 — Existing Components First

Before creating anything new search for:

```text
Existing Kernel Component

↓

Existing Plugin

↓

Existing Agent

↓

Existing Protocol

↓

Existing Data Structure

↓

Existing Metric

↓

Existing SceneGraph Node

↓

Existing Decision

↓

Existing Law

↓

Existing Rule

↓

Existing Benchmark

↓

Existing Experiment

↓

Existing Knowledge
```

If an existing component can solve the problem:

**REUSE IT.**

Creating new components is the last option.

---

# SECTION 5 — Source Of Truth

Never introduce another source of truth.

Every object MUST have exactly one owner.

Examples:

- Decision → DecisionGraph
- Scene → SceneGraph
- Knowledge → Commercial Genome
- Metrics → Metric Registry
- Events → Event Bus
- State → State Machine

If duplicate ownership appears:

Stop implementation.

Propose architectural refactoring.

---

# SECTION 6 — Knowledge Before Code

Always ask:

- Can Commercial Genome solve this?
- Can Knowledge Base solve this?
- Can Benchmark solve this?
- Can Research solve this?

If YES:

Do NOT write code.

Improve knowledge instead.

---

# SECTION 7 — Before Adding An Agent

Ask:

- Can an existing agent perform this?
- Can this become a capability?
- Can this become a plugin?
- Can this become knowledge?
- Can this become a protocol extension?

New agents require extraordinary justification.

---

# SECTION 8 — Before Adding A Metric

Ask:

- Does this metric already exist?
- Can existing metric be reused?
- Who owns this metric?
- Is there another implementation?

Duplicate metrics are prohibited.

---

# SECTION 9 — Before Writing A Patch

Ask:

- What is the root cause?
- Can architecture eliminate the problem?
- Can SceneGraph solve it?
- Can DecisionGraph solve it?
- Can Protocol solve it?

Patches are temporary.

Architecture is permanent.

---

# SECTION 10 — Experimental Knowledge

Experimental Knowledge has higher priority than assumptions.

If experiments contradict heuristics:

Experiments win.

If experiments contradict opinions:

Experiments win.

If experiments contradict intuition:

Experiments win.

Evidence has the highest authority.

---

# SECTION 11 — During Implementation

Continuously evaluate:

- Did I create another bridge?
- Did I create another hook?
- Did I duplicate logic?
- Did I duplicate knowledge?
- Did I duplicate metrics?
- Did I increase coupling?
- Did I introduce hidden state?
- Did I increase entropy?

If YES:

Stop.

Redesign.

---

# SECTION 12 — Architectural Debt

Every Pull Request SHALL reduce one of:

- Duplicate code
- Duplicate metrics
- Duplicate knowledge
- Temporary adapters
- Bridges
- Hooks
- Recalibration
- Fallback chains

If PR only increases complexity:

Reject the implementation.

---

# SECTION 13 — Rule Of One Change

When refining DAOS:

Change exactly one architectural concept at a time.

Measure.

Benchmark.

Learn.

Repeat.

Never modify multiple commercial variables simultaneously.

---

# SECTION 14 — Benchmark Driven Engineering

Every architectural modification SHALL answer:

- What improved?
- What regressed?
- Why?
- Is the regression acceptable?
- Can the improvement be reproduced?

Without benchmark:

No production.

---

# SECTION 15 — Engineering Mindset

Do not think:

"How do I implement this?"

Think:

"Where should this responsibility live?"

Correct ownership is more important than correct code.

---

# SECTION 16 — Commercial Mindset

Remember:

DAOS is NOT generating images.

DAOS is making commercial decisions.

Image generation is only one execution backend.

Commercial correctness always has higher priority than visual beauty.

---

# SECTION 17 — Architecture Audit Checklist

Before every commit verify:

- ✓ No new source of truth
- ✓ No duplicated metrics
- ✓ No duplicated laws
- ✓ No duplicated rules
- ✓ No unnecessary plugins
- ✓ No unnecessary agents
- ✓ No unnecessary hooks
- ✓ No permanent patches
- ✓ No protocol violations
- ✓ No kernel violations
- ✓ Commercial Genome reused
- ✓ Experimental Knowledge considered
- ✓ SceneGraph respected
- ✓ DecisionGraph respected
- ✓ Constitution respected

If any item fails:

Implementation is incomplete.

---

**END OF DOCUMENT**
