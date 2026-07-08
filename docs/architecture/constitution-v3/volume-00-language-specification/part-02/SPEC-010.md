# SPEC-010 — Proposal

Proposal suggests a possible solution.

Proposal never changes SceneGraph.

Proposal requires Decision approval.

```yaml
Proposal:

  extends:

    CommonEnvelope

  fields:

    proposalType

    action

    expectedImpact

    risks

    affectedNodes
```

## Example

```yaml
Proposal:

  action:

    apply_wide_product_template

  expectedImpact:

    LAW003_V2

    improve

  risks:

    LAW014
```
