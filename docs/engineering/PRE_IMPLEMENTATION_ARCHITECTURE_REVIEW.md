# Pre-Implementation Architecture Review

**Version:** 1.0  
**Status:** Mandatory  
**Applies to:** Cursor · AI Agents · Human Engineers  

> Run this review **before writing code**. Derived from [RFC-010 Architecture Council](../rfc/RFC-010_ARCHITECTURE_COUNCIL.md) and [Cursor Engineering Kernel](./CURSOR_ENGINEERING_KERNEL.md).

**Output:** Architecture Proposal → Implementation Specification (no source code in this step).

---

## 1. Problem definition

- What problem is being solved?
- Which subsystem owns this problem?
- Is this a new capability or a fix?

---

## 2. Root cause

Classify origin:

- [ ] Knowledge
- [ ] Architecture
- [ ] Protocol
- [ ] Implementation
- [ ] Benchmark
- [ ] Configuration
- [ ] Provider
- [ ] External system

**If root cause is unknown → STOP. Do not implement.**

---

## 3. Knowledge review

Can existing knowledge solve this?

- [ ] [Commercial Genome](../knowledge/Commercial-Genome/)
- [ ] [Experimental Knowledge v1.0](../knowledge/Experimental-Knowledge-v1.0.md)
- [ ] Constitution volumes (research, ontology, resolution)
- [ ] Benchmark history

**If yes → reject implementation; improve or reuse knowledge.**

---

## 4. Existing components first

Search before creating:

- [ ] Kernel component
- [ ] Plugin
- [ ] Agent
- [ ] Protocol extension
- [ ] Metric ([Metric Registry](../architecture/constitution-v3/volume-26-metric-registry/))
- [ ] SceneGraph / DecisionGraph object
- [ ] Feature flag ([Vol 28](../architecture/constitution-v3/volume-28-feature-flag-governance/))

**New module/agent is the last option.**

---

## 5. Ownership and SSOT

- [ ] Exactly one owner per affected object
- [ ] No duplicate metrics
- [ ] No duplicate commercial logic
- [ ] No new shadow source of truth

---

## 6. Complexity estimate

Document:

```yaml
newObjects:
newPlugins:
newDependencies:
newMetrics:
newProtocols:
entropyDelta:
```

If entropy increases without debt reduction → require explicit justification.

---

## 7. Benchmark and quality plan

- [ ] Which benchmark validates this?
- [ ] Baseline defined?
- [ ] Regression criteria?
- [ ] [Platform Quality Governance](../architecture/constitution-v3/volume-29-platform-quality-governance/) gates satisfied?

---

## 8. Documentation plan

- [ ] RFC required?
- [ ] ADR required?
- [ ] Constitution volume update required? (rare)
- [ ] Knowledge / EKB update?
- [ ] Roadmap update?

---

## 9. Implementation specification

Before coding, produce:

```yaml
AffectedFiles:
AffectedObjects:
Protocols:
MigrationOrder:
ExpectedMetrics:
AcceptanceCriteria:
RollbackStrategy:
BenchmarkPlan:
FeatureFlags:
```

---

## 10. Release decision (after implementation)

Choose exactly one:

- Approve
- Approve With Monitoring
- Require Benchmark
- Require Refactoring
- Rollback
- Reject

---

## Related

- [RFC-010 — Architecture Council Protocol](../rfc/RFC-010_ARCHITECTURE_COUNCIL.md)
- [DAOS Engineering Playbook](./DAOS_ENGINEERING_PLAYBOOK.md)
- [Implementation Roadmap](../roadmap/IMPLEMENTATION_ROADMAP.md)
