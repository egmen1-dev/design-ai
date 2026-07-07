# SPEC-906 — Overlay Renderer

## Consumes

```yaml
OverlayNode

ProductNode.actual

TypographyLayer
```

## Produces

```yaml
OverlayLayer
```

Overlay Renderer SHALL:

- respect ProductNode.actual
- respect safe zones
- respect hierarchy
- respect governance constraints

Overlay Renderer SHALL NOT:

- calculate product geometry
- guess product bounds
- use planned geometry when actual exists
