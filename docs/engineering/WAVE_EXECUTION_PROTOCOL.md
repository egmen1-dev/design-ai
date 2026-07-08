# DAOS Wave Execution Protocol
Status:
Canonical
Layer:
Engineering Execution
Normative:
Mandatory
Authority:
DAOS Architecture Constitution V3
RFC-010 Architecture Council
Engineering Playbook
Implementation Roadmap v2.0

---
# Purpose
This protocol defines the mandatory execution process for every DAOS implementation Wave.
A Wave is an engineering migration unit.
A Wave SHALL implement exactly one architectural objective.

---
# Wave Definition
Every Wave SHALL contain:
```yaml
WaveId
RFCReference
ComplianceViolations
ImplementationScope
AcceptanceCriteria
RollbackPlan
BenchmarkPlan
MigrationRisk
ExpectedBusinessImpact
```

A Wave SHALL NOT implement multiple unrelated RFCs.

---
# Mandatory Pre-Wave Review
Every Wave SHALL begin with an Architecture Council Review.
The following questions SHALL be answered:
```yaml
Why does this Wave exist?
Which Constitution volumes are implemented?
Which Compliance violations are closed?
Which Roadmap phase does this Wave belong to?
Which future Waves become unblocked?
```
If any answer is missing,
the Wave SHALL NOT begin.

---
# Scope Definition
Every Wave SHALL define:
```yaml
Included
Excluded
Deferred
```
Scope expansion during implementation is prohibited.
If additional work is discovered,
a new RFC or future Wave SHALL be created.

---
# Engineering Rules
Every Wave SHALL satisfy:
```yaml
No Architecture Rewrite
No Hidden Refactor
No Scope Expansion
No Silent Behavior Change
Backward Compatibility
Feature Flag if Required
Deterministic Migration
```

---
# Runtime Change Budget
Every Wave SHALL estimate:
```yaml
Files Created
Files Modified
Public API Changes
Schema Changes
Runtime Changes
Migration Cost
```
Unexpected growth SHALL trigger Council Review.

---
# Testing Requirements
Every Wave SHALL execute:
```yaml
Unit Tests
DAOS Tests
Specification Tests
Lint
Typecheck
Benchmark
Regression Analysis
```
Missing verification SHALL block merge.

---
# Documentation Requirements
Every Wave SHALL produce:
```yaml
Wave Report
Migration Notes
Compatibility Notes
Diagnostics Changes
Known Limitations
```
Documentation is mandatory.

---
# Completion Checklist
Before merge:
```yaml
RFC Implemented
Acceptance Criteria Passed
Tests Passed
Benchmark Passed
No Unexpected Regression
Roadmap Updated
Compliance Improved
```
All items SHALL be true.

---
# Post-Wave Review
Architecture Council SHALL verify:
```yaml
Expected Result
Actual Result
Remaining Technical Debt
Next Unblocked RFC
Compliance Delta
```

---
# Wave Principle
A Wave exists to reduce architectural debt.
A Wave SHALL NOT increase architectural entropy.
Every completed Wave must leave the platform more deterministic than before.

---
END

