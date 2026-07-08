// DAOS Wave Report Template (Universal)
// Council-canonical. Every Wave Report SHALL follow exactly this report structure.

```yaml
Wave:
  WaveId: <Wave number, e.g. 37>
  Date: <YYYY-MM-DD>

RFC:
  RFCReference: <e.g. RFC-2800>

ArchitectureGoal: <one architectural objective statement>

ConstitutionVolumes:
  - <Vol number>

ComplianceViolations:
  Closed: <V-xxx list or "none">
  PartiallyResolved: <V-xxx list or "none">
  Remaining: <V-xxx list or "none">
  New: <V-xxx list or "none">

Scope:
  Included:
    - <included objective items>
  Excluded:
    - <explicit excluded items>
  Deferred:
    - <deferred items>

AcceptanceCriteria:
  - <check, e.g. "All unit tests PASS" : PASS/FAIL>

ExitCriteria:
  - <architecture readiness check, PASS/FAIL>

ArchitectureDelta:
  - <what architectural coupling/entropy changed>

ComplianceDelta:
  ClosedViolations:
    - <V-xxx>
  PartiallyResolvedViolations:
    - <V-xxx>
  RemainingViolations:
    - <V-xxx>
  NewViolations:
    - <V-xxx>

ArchitectureHealthDelta:
  ArchitectureHealthBefore: <number 0-100>
  ArchitectureHealthAfter: <number 0-100>
  ArchitectureHealthDelta: <After - Before, with sign>

TechnicalDebtDelta:
  - <what debt item decreased/increased, optional rationale>

BusinessImpact:
  - <expected/observed business impact statement>

MigrationNotes:
  - <migration steps / feature flags / rollback approach>

CompatibilityNotes:
  - <what stays compatible and why>

Diagnostics:
  - <observability/diagnostics changes>

Tests:
  UnitTests: <PASS/FAIL + list>
  DAOSTests: <PASS/FAIL + list>
  SpecificationTests: <PASS/FAIL + list>
  Lint: <PASS/FAIL>
  Typecheck: <PASS/FAIL>
  RegressionAnalysis: <PASS/FAIL>

Benchmarks:
  - <benchmark plan and result (PASS/FAIL or numbers)>

RollbackPlan:
  - <rollback steps; flags disabled; artifacts removed>

KnownLimitations:
  - <what is not guaranteed>

NextWave:
  - <Wave number>

CouncilDecision:
  Status: <APPROVED | REJECTED>
  Architecture: <PASS | PARTIAL | FAIL>
  Implementation: <PASS | PARTIAL | FAIL>
  Quality: <PASS | PARTIAL | FAIL>
  Documentation: <PASS | PARTIAL | FAIL>
  Governance: <PASS | PARTIAL | FAIL>
  Migration: <PASS | PARTIAL | FAIL>
  CommercialIntegrity: <PASS | PARTIAL | FAIL>
  ArchitectureHealthDelta: <+N or -N>
  ComplianceDelta:
    - <V-xxx Closed / Partial / Remaining lines>
  TechnicalDebt: <Reduced / Unchanged / Increased>
  NextWave: <Wave number>
```

