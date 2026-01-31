# Phase 3: Telegram Bot — Full Specification

**Owner:** Cassian (CASSIAN_SANDMAN)  
**Status:** SPEC COMPLETE  
**Created:** 2026-01-31

---

## Overview

Build a Telegram-based mesh administration interface that integrates with the Virtual Teams persona model. Commands follow a `/mesh` namespace with subcommand routing.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Telegram API   │────▶│  Command Router  │────▶│  Agent Mesh     │
│  (Bot Gateway)  │     │  + Auth Layer    │     │  (Tailscale)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Virtual Teams   │
                        │  Notion DB       │
                        └──────────────────┘
```

---

## Command Reference

### Core Commands

| Command | Description | Role Required |
|---------|-------------|---------------|
| `/mesh help` | Show available commands | Viewer |
| `/mesh status` | Mesh health summary | Viewer |
| `/mesh agents` | List all agents | Viewer |

### Status & Monitoring

| Command | Description | Role Required |
|---------|-------------|---------------|
| `/mesh ping <agent>` | Direct health check | Viewer |
| `/mesh logs <agent> [n]` | Last n log lines (default 20) | Operator |
| `/mesh metrics` | Telemetry summary | Viewer |

### Permission Management

| Command | Description | Role Required |
|---------|-------------|---------------|
| `/mesh perms list` | Show all permissions | Operator |
| `/mesh perms grant <user> <role>` | Add permission | Exec |
| `/mesh perms revoke <user> <role>` | Remove permission | Exec |
| `/mesh perms audit` | Permission change log | Operator |

### Agent Management

| Command | Description | Role Required |
|---------|-------------|---------------|
| `/mesh agent <name> info` | Agent details | Viewer |
| `/mesh agent <name> restart` | Graceful restart | Operator |
| `/mesh agent <name> pause` | Suspend processing | Operator |
| `/mesh agent <name> resume` | Resume from pause | Operator |
| `/mesh agent <name> config` | View/set config | Operator |

---

## Role Hierarchy

```
Exec (Ely + designated)
  └── Operator (Oracle, Cassian, trusted personas)
        └── Viewer (Any authenticated Virtual Team member)
```

**Exec:** Full control, permission grants, destructive operations  
**Operator:** Management commands, logs, restarts  
**Viewer:** Read-only status and monitoring

---

## Permission Mapping

| Telegram User | Virtual Teams Persona | Role |
|---------------|----------------------|------|
| @GlassyNakamoto | Ely Beckman | Exec |
| @artificialmindsets | Alex (Oracle admin) | Exec |
| (Oracle bot) | Oracle | Operator |
| (Cassian bot) | Cassian Sandman | Operator |

Additional mappings configured in `mesh-bot/config/permissions.json`.

---

## Response Formatting

### Status Response (Example)
```
🟢 Mesh Status — All Systems Operational

Agents: 2/2 online
├─ 🟢 Oracle (100.113.222.30) — 142ms
└─ 🟢 Cassian (100.112.130.22) — 89ms

Last sweep: 2 min ago
Uptime: 99.8% (7d)
```

### Inline Buttons (Example)
```
[🔄 Restart Oracle] [📋 View Logs]
[⚙️ Config] [📊 Metrics]
```

---

## Error Handling

| Error | Response |
|-------|----------|
| Unknown command | "Unknown command. Try `/mesh help`" |
| Permission denied | "❌ Requires {role} role. Current: {user_role}" |
| Agent unreachable | "⚠️ {agent} unreachable. Last seen: {timestamp}" |
| Invalid args | "Usage: `/mesh {command} {expected_args}`" |

---

## Audit Trail

All commands logged to Virtual Teams activity:
- Timestamp
- Telegram user
- Command issued
- Target agent (if any)
- Result (success/failure)
- Error message (if failure)

---

## Dependencies

- Phase 1: Permission Layer (auth middleware)
- Phase 2: API Layer (agent endpoints)
- Clawdbot: Telegram channel integration
- Tailscale: Mesh connectivity

---

## Implementation Notes

1. **Bot token:** Use existing Clawdbot Telegram integration, not separate bot
2. **Command prefix:** `/mesh` avoids collision with standard Clawdbot commands
3. **Async feedback:** Long operations (restart) send initial ACK, then status update
4. **Rate limiting:** 10 commands/minute per user to prevent spam

---

## Files

```
mesh-bot/
├── src/
│   ├── commands/
│   │   ├── index.ts          # Command router
│   │   ├── status.ts         # /mesh status, agents, ping
│   │   ├── perms.ts          # /mesh perms *
│   │   ├── agent.ts          # /mesh agent *
│   │   └── help.ts           # /mesh help
│   ├── middleware/
│   │   ├── auth.ts           # Telegram → persona mapping
│   │   └── rateLimit.ts      # Per-user rate limiting
│   └── formatters/
│       ├── status.ts         # Status message templates
│       └── buttons.ts        # Inline button builders
├── config/
│   └── permissions.json      # User → role mapping
└── tests/
    └── commands.test.ts      # Command handler tests
```

---

*Cassian Sandman — Chief Intelligence Officer*
