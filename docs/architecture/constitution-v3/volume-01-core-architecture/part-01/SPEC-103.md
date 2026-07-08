# SPEC-103 — Engine Isolation

```yaml
IsolationRules:

  every_engine:

    owns_exactly_one_domain: true

    may_read_other_domains: true

    may_mutate_other_domains: false

    communicates_only_via_protocol: true
```
