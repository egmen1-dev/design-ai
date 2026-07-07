# SPEC-624 — Failure Recovery

Every failure produces Finding objects.

```yaml
Failure:

  stage

  reason

  severity

  recoveryStrategy

  retryAllowed

  evidence
```

Failures are first-class domain events.
