# Phase 3: Telegram Bot Admin Interface

**Owner:** Cassian Sandman  
**Status:** Draft  
**Dependencies:** Phase 2 (Web Surface) for API endpoints  
**Priority:** High  
**Estimated Effort:** 2-3 sessions

---

## Objective

Build Telegram bot commands for mesh administration that integrate with Virtual Teams personas. Enable authorized users to manage permissions, view mesh status, and execute admin actions directly from Telegram.

---

## Tasks

### 3.1 Core Bot Command Framework
- [ ] Design command routing architecture
- [ ] Implement `/mesh` command namespace
- [ ] Build permission check middleware (validates against Phase 1 permission layer)
- [ ] Create response formatters (inline buttons, structured messages)

### 3.2 Status & Monitoring Commands
- [ ] `/mesh status` — Show mesh health, connected agents, last sync
- [ ] `/mesh agents` — List active agents with status indicators
- [ ] `/mesh ping <agent>` — Round-trip latency check to specific agent
- [ ] `/mesh logs [agent] [limit]` — Recent mesh activity logs

### 3.3 Permission Management Commands
- [ ] `/mesh perms list` — Show current permission matrix
- [ ] `/mesh perms grant <agent> <capability>` — Grant capability
- [ ] `/mesh perms revoke <agent> <capability>` — Revoke capability
- [ ] `/mesh perms audit [agent]` — Permission change history

### 3.4 Agent Management Commands
- [ ] `/mesh agent <name> info` — Detailed agent profile
- [ ] `/mesh agent <name> restart` — Trigger agent restart
- [ ] `/mesh agent <name> pause` — Temporarily disable agent
- [ ] `/mesh agent <name> resume` — Resume paused agent

### 3.5 Virtual Teams Integration
- [ ] Map bot commands to Virtual Teams persona permissions
- [ ] Implement role-based command access (Exec vs. Operator vs. Viewer)
- [ ] Log all admin actions to Virtual Teams audit trail
- [ ] Support multi-org isolation (Covault vs. future orgs)

---

## Technical Design

### Command Structure
```
/mesh <domain> <action> [args...]

Domains:
- status    : Health and monitoring
- agents    : Agent management  
- perms     : Permission management
- config    : Configuration (Phase 4)
- broadcast : Multi-agent messaging (Phase 4)
```

### Permission Mapping
| Virtual Teams Role | Allowed Commands |
|--------------------|------------------|
| Partner/Exec       | All commands     |
| Operator           | status, agents (read), perms (read) |
| Viewer             | status only      |

### Response Format
- Use inline buttons for confirmation flows (destructive actions)
- Structured text with emoji indicators for status
- Link to web console for detailed views (Phase 2)

---

## Integration Points

- **Phase 1 (Permission Layer):** All commands validate against permission API
- **Phase 2 (Web Surface):** Commands link to detailed web views
- **Clawdbot Gateway:** Commands route through existing Telegram channel plugin

---

## Success Criteria

1. Authorized users can check mesh status from Telegram
2. Permission changes via Telegram logged with full audit trail
3. Response time < 2s for all read commands
4. Destructive actions require inline button confirmation
5. Unauthorized commands return clear denial message

---

## Open Questions

- [ ] Should we support slash commands or inline @mention commands?
- [ ] Rate limiting strategy for admin commands?
- [ ] Notification preferences (DM vs. channel)?

---

*Last Updated: 2026-01-31*
