# SPEC-111 — Engine Health Contract

Every engine must expose:

```yaml
Health:

  version

  status

  confidence

  latency

  protocol_version

  supported_objects

  diagnostics
```

No hidden state.
