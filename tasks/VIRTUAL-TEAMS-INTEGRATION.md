# Virtual Teams Integration Specification

**Authors:** Oracle + Cassian  
**Status:** SPEC DRAFT  
**Created:** 2026-01-31

---

## Overview

This spec defines how Evelyn and the mesh bot integrate with the Virtual Teams persona model in Notion.

---

## Persona → Permission Mapping

### Notion Virtual Teams DB Fields

| Field | Use |
|-------|-----|
| `Codename` | Unique identifier for permission grants |
| `Entity Type` | PERSONA / AGENT / SYSTEM |
| `Team` | Group membership for broadcast targeting |
| `Seniority` | Maps to role tier (Partner→Exec, etc.) |
| `Status` | Active/Inactive gates access |

### Role Derivation

```
Seniority: Partner/Cofounder     → Exec
Seniority: Lead/Director         → Operator  
Seniority: Member/Associate      → Viewer
Status: Inactive                 → Denied (all)
```

### Override Table

Explicit overrides in `config/permissions.json`:
```json
{
  "overrides": {
    "ORACLE": "Operator",
    "CASSIAN_SANDMAN": "Operator",
    "ELY_BECKMAN": "Exec"
  }
}
```

---

## Telegram User → Persona Binding

### Manual Binding

```
/mesh bind @TelegramUser PERSONA_CODENAME
```

Requires Exec role. Stored in permissions.json.

### Binding Table

| Telegram | Persona | Role |
|----------|---------|------|
| @GlassyNakamoto | ELY_BECKMAN | Exec |
| @artificialmindsets | ALEX_ORACLE_ADMIN | Exec |

---

## Activity Logging

All mesh commands log to Virtual Teams activity:

### Log Entry Schema

```json
{
  "timestamp": "2026-01-31T14:23:00Z",
  "actor": "CASSIAN_SANDMAN",
  "action": "agent_restart",
  "target": "ORACLE",
  "result": "success",
  "details": {
    "command": "/mesh agent oracle restart",
    "latency_ms": 1420
  }
}
```

### Log Destination

- Primary: `memory/mesh-activity.jsonl` (local)
- Secondary: Notion "Activity Log" DB (async sync)

---

## Bidirectional Sync

### Notion → Mesh

When persona status changes in Notion:
1. Webhook fires to mesh coordinator
2. Permission cache invalidated
3. Next command re-fetches from Notion

### Mesh → Notion

When permission granted/revoked via `/mesh perms`:
1. Local permission updated immediately
2. Async job syncs to Notion Virtual Teams DB
3. Conflict resolution: Notion wins (source of truth)

---

## Group Targeting

### Team → Group Mapping

| Notion Team | Mesh Group |
|-------------|------------|
| Executive Team | `exec` |
| Operations | `ops` |
| Business Development | `bd` |
| Research | `research` |
| All Active | `all` |

### Custom Groups

Defined in `config/groups.json`:
```json
{
  "mesh-admins": ["ORACLE", "CASSIAN_SANDMAN"],
  "flagship-bd": ["EVELYN_1", "EVELYN_2"]
}
```

---

## Implementation Phases

### Phase 1-2 (Oracle)

- [ ] Auth middleware reads from permissions.json
- [ ] Placeholder for Notion sync (local-only first)
- [ ] Activity log to local JSONL

### Phase 3-4 (Cassian)

- [ ] `/mesh bind` command for user→persona
- [ ] Notion webhook handler for status changes
- [ ] Async sync job for permission changes
- [ ] Activity log sync to Notion

---

## Security Considerations

1. **Persona impersonation:** Only Exec can bind users
2. **Stale cache:** 5 min TTL on permission cache
3. **Audit trail:** All permission changes logged
4. **Notion as source:** On conflict, Notion wins

---

*Joint spec — Oracle + Cassian*
