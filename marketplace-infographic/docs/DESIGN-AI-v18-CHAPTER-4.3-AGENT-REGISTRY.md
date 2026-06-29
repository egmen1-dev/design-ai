# DESIGN AI v18 — Chapter 4.3: Agent Registry

> Реализация: `agent-registry.ts`, `agent-registry-validation.ts`, `agent-registry-capabilities.ts`

## Purpose

Agent Registry — центральный каталог всех агентов. Registry **не управляет** агентами — только знает, кто существует, какие версии доступны, и какие sections потребляет/создаёт.

## Golden Rule

Registry — **единственный** механизм обнаружения агентов. Pipeline не создаёт агентов вручную и не обращается к ним напрямую.

## Flow

```text
Lifecycle Manager → Agent Registry → BlueprintAgent
```

## Chapter 4.3 Interface

```typescript
registry.register(agent);
registry.unregister(agentId);
registry.getAgent(agentId);        // throws if missing
registry.hasAgent(agentId);
registry.getAll();
registry.findByCategory(AgentCategory.CREATIVE_DIRECTOR);
```

## AgentDescriptor (Chapter 4.3)

- `id`, `version`, `category`
- `produces`, `consumes`
- `capabilityTags` — для plugin architecture
- `status` — ACTIVE | DISABLED | EXPERIMENTAL | DEPRECATED

## Version Management

Несколько версий одного агента:

```typescript
registry.register(v1);
registry.register(v2);
registry.setActiveVersion("scene-director", "2.0.0");
```

## Lazy Instantiation

```text
Registry → Create Agent → Execute → Dispose
```

## Registry Events

- `agent_registered`
- `agent_updated`
- `agent_disabled`
- `agent_removed`

## Startup Validation

```typescript
validateAgentRegistry(registry);
assertAgentRegistryValid(registry); // blocks pipeline boot on failure
```

Проверяет: unique ID, version, contract, ownership conflicts, cyclic dependencies.

## Test

```bash
npx tsx src/lib/render-blueprint/agent-registry-v43.spec.ts
npx tsx src/lib/render-blueprint/agent-registry.spec.ts
```
