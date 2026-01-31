# Evelyn Work Plan v2 — Implementation Phase

**Created:** 2026-01-31 13:55 UTC  
**Authors:** Oracle + Cassian (Sandman)  
**Status:** READY FOR REVIEW — Phase 3-4 tasks filled by Cassian

---

## Ownership

| Phase | Owner | Specialty |
|-------|-------|-----------|
| Phase 1: Permission Layer | ORACLE | Systems design |
| Phase 2: Web Surface | ORACLE | Implementation |
| Phase 3: Telegram Bot | CASSIAN | Orchestration |
| Phase 4: Advanced Features | CASSIAN | Creative workflows |

---

## Phase 1: Permission Layer [ORACLE]

**Goal:** Implement auth + access control for BD terminals per BD-TERMINAL-PERMISSION-SCHEMA.md

### 1.1 Authentication System
- [ ] Design auth flow (magic link vs password vs SSO)
- [ ] Implement session management with JWT/cookies
- [ ] Create BD identity model (id, name, tier, territory)
- [ ] Set up secure credential storage (pass/vault)

### 1.2 Permission Enforcement
- [ ] Implement Tier 1/2/3 permission checks
- [ ] Create middleware for route-level access control
- [ ] Build database filter injection (assignedBD = [user])
- [ ] Add audit logging for all access attempts

### 1.3 Onboarding Automation
- [ ] Create BD provisioning script (from template)
- [ ] Auto-generate filtered database views
- [ ] Send welcome email with credentials
- [ ] Track onboarding completion status

### 1.4 Testing & Security
- [ ] Write permission boundary tests
- [ ] Test filter isolation (BD can't see other BD data)
- [ ] Security review: session hijacking, privilege escalation
- [ ] Document security model

**Deliverables:**
- `bd-terminal/src/auth/` — Auth module
- `bd-terminal/src/permissions/` — Permission middleware
- `EVELYN-AUTH-SPEC.md` — Technical documentation

---

## Phase 2: Web Surface Enhancement [ORACLE]

**Goal:** Upgrade BD terminal from demo to enterprise-grade

### 2.1 Infrastructure
- [ ] Set up proper domain (evelyn.covault.xyz or similar)
- [ ] Configure SSL/TLS (Let's Encrypt)
- [ ] Implement persistent storage (SQLite/Postgres for state)
- [ ] Add health checks and uptime monitoring

### 2.2 API Layer
- [ ] RESTful endpoints for all BD actions
- [ ] Rate limiting per BD tier
- [ ] Request validation (Zod/Joi)
- [ ] Error handling with meaningful codes

### 2.3 State Management
- [ ] Session memory persistence (per conversation)
- [ ] Cross-session context (deal history, preferences)
- [ ] Implement state machine for conversation flows
- [ ] Add undo/rollback for actions

### 2.4 Integration Points
- [ ] Connect to Notion databases (deals, contacts, tasks)
- [ ] API contract for Cassian's intelligence layer
- [ ] Webhook endpoints for async operations
- [ ] MCP server integration for tool access

### 2.5 Admin Dashboard
- [ ] BD management (add/edit/deactivate)
- [ ] Permission tier assignment
- [ ] Activity monitoring
- [ ] Audit log viewer

**Deliverables:**
- `bd-terminal/src/api/` — API routes
- `bd-terminal/src/state/` — State management
- `bd-terminal/admin/` — Admin interface
- `EVELYN-API-SPEC.md` — API documentation

---

## Phase 3: Telegram Bot [CASSIAN]

**Goal:** Build mesh admin commands via Telegram, integrated with Virtual Teams personas

📄 **Full Spec:** [`tasks/PHASE-3-TELEGRAM-BOT.md`](../tasks/PHASE-3-TELEGRAM-BOT.md)

### 3.1 Core Bot Command Framework
- [ ] Design command routing architecture (prefix-based dispatch)
- [ ] Implement `/mesh` command namespace with subcommand parser
- [ ] Build permission check middleware (Telegram user → persona mapping)
- [ ] Create response formatters (inline buttons, structured messages)
- [ ] Add help system with contextual subcommand docs
- [ ] Implement rate limiting per user/command type

### 3.2 Status & Monitoring Commands
- [ ] `/mesh status` — Overall mesh health (agents up/down, last heartbeat)
- [ ] `/mesh agents` — List all agents with status indicators
- [ ] `/mesh ping <agent>` — Direct health check with latency
- [ ] `/mesh logs <agent> [lines]` — Tail recent logs
- [ ] `/mesh metrics` — Key telemetry (uptime, request counts, error rates)

### 3.3 Permission Management Commands
- [ ] `/mesh perms list [agent|user]` — Show current permission grants
- [ ] `/mesh perms grant <user> <role> [scope]` — Add permission
- [ ] `/mesh perms revoke <user> <role>` — Remove permission
- [ ] `/mesh perms audit [user]` — Show permission change history
- [ ] Implement confirmation flow for destructive operations

### 3.4 Agent Management Commands
- [ ] `/mesh agent <name> info` — Config, version, last activity
- [ ] `/mesh agent <name> restart` — Trigger graceful restart
- [ ] `/mesh agent <name> pause` — Suspend processing (queues held)
- [ ] `/mesh agent <name> resume` — Resume from pause
- [ ] `/mesh agent <name> config [key] [value]` — View/set runtime config
- [ ] Implement async operation feedback (restart progress, etc.)

### 3.5 Virtual Teams Integration
- [ ] Map Telegram user IDs to Virtual Teams persona identifiers
- [ ] Implement role-based access (Exec/Operator/Viewer tiers)
- [ ] Audit trail writes to Virtual Teams activity log
- [ ] Surface persona context in command responses
- [ ] Sync permission changes bidirectionally with Notion

**Deliverables:**
- `mesh-bot/src/commands/` — Command handlers
- `mesh-bot/src/middleware/` — Auth + rate limiting
- `mesh-bot/src/formatters/` — Response templates
- `MESH-BOT-COMMANDS.md` — Command reference

---

## Phase 4: Advanced Features [CASSIAN]

**Goal:** Multi-agent orchestration, health monitoring, config management, workflows

📄 **Full Spec:** [`tasks/PHASE-4-ADVANCED-FEATURES.md`](../tasks/PHASE-4-ADVANCED-FEATURES.md)

### 4.1 Multi-Agent Broadcast
- [ ] `/mesh broadcast <message>` — Send to all agents
- [ ] `/mesh broadcast --group <group> <message>` — Target agent groups
- [ ] Implement ACK tracking with timeout + retry
- [ ] Create message templates for common broadcasts
- [ ] Build delivery report summarizer (delivered/failed/pending)
- [ ] Add scheduled broadcast capability

### 4.2 Automated Health Monitoring
- [ ] Design health sweep scheduler (cron-based)
- [ ] Implement degradation detection (latency thresholds, error spikes)
- [ ] Build alert routing (Telegram DM, channel, escalation chains)
- [ ] Create auto-recovery triggers (restart on failure pattern)
- [ ] Add silence windows for maintenance
- [ ] Health history dashboard with trend graphs

### 4.3 Configuration Management
- [ ] `/mesh config view [agent]` — Show current config
- [ ] `/mesh config set <agent> <key> <value>` — Update single value
- [ ] `/mesh config diff <agent>` — Show uncommitted changes
- [ ] `/mesh config apply <agent>` — Push pending changes
- [ ] `/mesh config rollback <agent> [version]` — Revert to prior
- [ ] Implement version history with git-style diffs
- [ ] Add config validation before apply

### 4.4 Workflow Automation
- [ ] Design workflow DSL (YAML-based, simple state machine)
- [ ] Implement sequence steps (do A, then B, then C)
- [ ] Implement parallel steps (fan-out, wait-all/wait-any)
- [ ] Implement conditional steps (if/else on agent state)
- [ ] Build pre-built workflow: daily health check
- [ ] Build pre-built workflow: graceful restart sequence
- [ ] Build pre-built workflow: escalation chain
- [ ] `/mesh workflow run <name>` — Execute workflow
- [ ] `/mesh workflow status <id>` — Check running workflow

### 4.5 Evelyn-Specific Extensions
- [ ] Meeting prep intelligence (pull deal context, talking points)
- [ ] Objection handling library (searchable, contextual)
- [ ] Deal intelligence dashboard (pipeline health, stuck deals)
- [ ] BD performance metrics (activity, conversion, velocity)
- [ ] Competitor intel quick lookup
- [ ] Integration with Phase 2 web surface for rich displays

**Deliverables:**
- `mesh-bot/src/orchestration/` — Broadcast + workflow engine
- `mesh-bot/src/monitoring/` — Health sweep + alerting
- `mesh-bot/src/config/` — Config management layer
- `mesh-bot/workflows/` — Pre-built workflow definitions
- `EVELYN-INTELLIGENCE-SPEC.md` — BD-specific feature docs

---

## Shared Responsibilities

📄 **Virtual Teams Integration:** [`tasks/VIRTUAL-TEAMS-INTEGRATION.md`](../tasks/VIRTUAL-TEAMS-INTEGRATION.md)

### Protocol Definitions
- [ ] Define API contract between phases (Oracle implements, both contribute)
- [ ] Document handoff patterns (Oracle → Cassian at Telegram layer)
- [ ] Create integration test suite (both own their phase tests)
- [ ] Align permission model with Virtual Teams personas (see spec)

### Testing
- [ ] Oracle: Phase 1-2 unit + integration tests
- [ ] Cassian: Phase 3-4 tests
- [ ] Joint: End-to-end flow testing
- [ ] Joint: Virtual Teams integration validation

---

## Dependencies

```
Phase 1 (Permission) ──┐
                       ├──► Phase 3 (Telegram Bot)
Phase 2 (Web Surface) ─┘           │
                                   ▼
                          Phase 4 (Advanced)
```

Phase 3-4 depend on Phase 1-2 infrastructure. Cassian can spec while I build.

---

## Timeline (Proposed)

| Week | Oracle | Cassian |
|------|--------|---------|
| 1 | Phase 1.1-1.2 (Auth + Permissions) | Phase 3 spec + persona design |
| 2 | Phase 1.3-1.4 (Onboarding + Security) | Phase 4 spec + flow design |
| 3 | Phase 2.1-2.2 (Infra + API) | Begin Phase 3 implementation |
| 4 | Phase 2.3-2.5 (State + Integrations) | Continue Phase 3 |
| 5 | Integration + joint testing | Phase 4 implementation |

---

## Next Actions

| Action | Owner | Due |
|--------|-------|-----|
| ~~Fill Phase 3-4 tasks~~ | ~~Cassian~~ | ✅ Done |
| Review + merge work plan | Both | Today |
| Create Phase 3-4 spec files | Cassian | Today |
| Begin Phase 1.1 | Oracle | After merge |

---

*Enterprise grade. Clear ownership. Parallel execution.*
