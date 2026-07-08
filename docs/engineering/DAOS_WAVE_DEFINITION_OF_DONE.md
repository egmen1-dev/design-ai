# DAOS Wave Definition of Done
Status:
Canonical
Layer:
Engineering
Normative:
Mandatory
Authority:
DAOS Architecture Constitution V3
Implementation Roadmap
RFC-010 Architecture Council
Wave Execution Protocol

---
# Purpose
This document defines when a Wave is considered complete.
Passing tests alone SHALL NOT define completion.
A Wave SHALL satisfy architectural, engineering, commercial and governance requirements.

---
# Completion Categories
Every Wave SHALL satisfy the following categories.
```yaml
Architecture
Implementation
Quality
Documentation
Governance
Migration
Commercial Integrity
```

---
# 1. Architecture
Required:
```yaml
RFC Implemented
No Constitution Violations
No New Source of Truth
Ownership Preserved
Dependencies Updated
Roadmap Updated
```

---
# 2. Implementation
Required:
```yaml
Acceptance Criteria
Feature Scope
No Scope Expansion
Backward Compatibility
No Hidden Refactor
```

---
# 3. Quality
Required:
```yaml
Unit Tests
DAOS Tests
Specification Tests
Lint
Typecheck
Regression
Benchmark
```

---
# 4. Documentation
Required:
```yaml
Wave Report
Migration Notes
Diagnostics
Compatibility Notes
Known Limitations
```

---
# 5. Governance
Architecture Council SHALL confirm:
```yaml
Compliance Improved
Violation Closed
Technical Debt Reduced
Roadmap Progressed
No New Architectural Debt
```

---
# 6. Migration
Migration SHALL verify
```yaml
Legacy Path
New Path
Rollback
Feature Flags
Compatibility
```

---
# 7. Commercial Integrity
Commercial layer SHALL verify
```yaml
Commercial Rules Preserved
Genome Integrity
Knowledge Integrity
Decision Integrity
Scene Integrity
```

---
# Completion Score
Each category receives
```yaml
PASS
PARTIAL
FAIL
```
Wave Status
```yaml
READY
↓
MERGEABLE
↓
COMPLETED
```
Only READY Waves MAY be merged.

---
# Mandatory Council Questions
Before merge Council SHALL answer
```yaml
What problem was solved?
What Constitution volumes were implemented?
What Compliance violations were closed?
What RFCs became unblocked?
Was technical debt reduced?
Did architectural entropy decrease?
```

---
# Mandatory Report
Every Wave Report SHALL end with
```yaml
Architecture Delta
Compliance Delta
Roadmap Delta
Business Impact
Next Wave
```

---
# Wave Definition of Done
A Wave is complete only when
```yaml
Implementation Exists
Documentation Exists
Benchmarks Pass
Compliance Improves
Architecture Becomes Simpler
```
If only code changed,
the Wave is NOT complete.

---
END

