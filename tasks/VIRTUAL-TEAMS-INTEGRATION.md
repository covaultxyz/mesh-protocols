# Virtual Teams Integration Spec

**Owner:** Cassian Sandman  
**Status:** Draft  
**Scope:** Cross-cutting concern across all phases  
**Priority:** High

---

## Objective

Ensure the Mesh Admin Console integrates seamlessly with Covault's Virtual Teams infrastructure. Personas are not just metadata — they define capabilities, permissions, and trust boundaries.

---

## Core Principles

### 1. Persona-Aware Permissions
Every mesh operation maps to a Virtual Teams persona capability:
- Partner/Exec → Full admin
- Operator → Read + limited write
- Viewer → Read only
- External → Denied by default

### 2. Audit Trail Requirements
All admin actions logged to Virtual Teams audit surface:
- WHO (persona identifier)
- WHAT (action taken)
- WHEN (timestamp, timezone)
- WHERE (source: Telegram, Web, API)
- WHY (optional: user-provided reason)

### 3. Multi-Org Isolation
Design for future state: multiple orgs, each with their own:
- Persona registry
- Permission matrix
- Audit logs
- Mesh topology

---

## Data Model Extensions

### Persona → Mesh Agent Mapping
```yaml
persona:
  id: CASSIAN_SANDMAN
  type: PERSONA
  team: EXECUTIVE_TEAM
  
meshBinding:
  agentId: cassian-sandman
  webhookUrl: http://100.112.130.22:18789/hooks/agent
  capabilities:
    - mesh.admin
    - mesh.broadcast
    - mesh.config.write
  trustLevel: full
```

### Permission Matrix Location
Stored in Notion: `Virtual Teams DB` → `Mesh Permissions` view  
Synced to local cache on mesh nodes for fast lookup.

---

## Integration Touchpoints

### Notion Databases
| Database | Purpose |
|----------|---------|
| Virtual Teams | Persona registry, capabilities |
| Mesh Permissions | Action → Role mapping |
| Audit Log | All admin actions |
| Config History | Configuration changes |

### Clawdbot Hooks
- On persona update → sync to mesh permission cache
- On capability grant → update agent binding
- On audit event → write to Notion + local log

---

## Implementation Tasks

### Phase 1 Alignment
- [ ] Define permission primitives that map to Virtual Teams roles
- [ ] Build Notion sync for permission matrix
- [ ] Implement persona lookup in permission checks

### Phase 2 Alignment
- [ ] Web console reads persona from session
- [ ] Display role-appropriate UI (hide unauthorized actions)
- [ ] Audit log viewer with persona filtering

### Phase 3 Alignment
- [ ] Telegram user → Persona resolution
- [ ] Command responses include persona context
- [ ] Inline buttons respect persona permissions

### Phase 4 Alignment
- [ ] Workflow execution runs as persona
- [ ] Analytics segmented by persona/role
- [ ] Health alerts respect notification preferences per persona

---

## Security Considerations

1. **Persona Impersonation Prevention**
   - Telegram user ID must match registered persona binding
   - Web sessions require authenticated persona claim
   - API calls require signed persona token

2. **Privilege Escalation Prevention**
   - Permission changes require higher-privilege approver
   - Self-grant blocked by design
   - Audit log is append-only

3. **Cross-Org Leakage Prevention**
   - Org ID in all queries
   - No cross-org joins
   - Separate encryption keys per org (future)

---

## Success Criteria

1. No mesh action executable without valid persona binding
2. 100% of admin actions appear in audit log within 5s
3. Permission changes sync to all nodes within 60s
4. Web/Telegram/API all enforce identical permission rules

---

*Last Updated: 2026-01-31*
