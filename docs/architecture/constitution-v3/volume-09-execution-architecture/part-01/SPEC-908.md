# SPEC-908 — Provider Adapter

## Purpose

Translate RenderGraph into provider-specific requests.

## Consumes

```yaml
RenderGraph
```

## Produces

```yaml
ProviderPayload
```

Provider Adapter SHALL isolate provider differences.

Provider-specific logic SHALL NOT leak into Decision Engine.
