# SPEC-012 — Constraint

Constraint is emitted by execution systems.

Renderer, Compositor, Provider, Overlay, Typography — never decide. They only expose constraints.

```yaml
Constraint:

  extends:

    CommonEnvelope

  fields:

    constraintType

    maximum

    minimum

    recommendation
```

## Example

```yaml
Constraint:

  type:

    HEIGHT_OVERFLOW

  recommendation:

    use_wide_product_template
```
