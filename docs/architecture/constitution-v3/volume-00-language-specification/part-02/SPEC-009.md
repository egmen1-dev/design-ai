# SPEC-009 — Finding

A Finding represents an observed problem.

Finding never modifies the system.

Finding never proposes implementation.

Finding only reports facts.

```yaml
Finding:

  extends:

    CommonEnvelope

  fields:

    findingType

    severity

    metric

    expected

    actual

    recommendation

  severity:

    info

    warning

    critical
```

## Example

```yaml
Finding:

  id:

    FINDING_PRODUCT_TOO_SMALL

  sourceAgent:

    ProductScaleAudit

  targetAgent:

    DecisionEngine

  confidence:

    0.97

  metric:

    productAreaRatio

  actual:

    0.28

  expected:

    0.45

  recommendation:

    increase_product_area
```
