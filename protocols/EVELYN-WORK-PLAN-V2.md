# Evelyn Work Plan v2 — Implementation Phase

**Created:** 2026-01-31 13:55 UTC  
**Authors:** Oracle + Cassian (Sandman)  
**Status:** DRAFT — Awaiting Cassian's Phase 3-4 tasks

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
- [ ] Design command routing architecture
- [ ] Implement `/mesh` command namespace
- [ ] Build permission check middleware
- [ ] Create response formatters (inline buttons, structured messages)

### 3.2 Status & Monitoring Commands
- [ ] `/mesh status`, `/mesh agents`, `/mesh ping`, `/mesh logs`

### 3.3 Permission Management Commands
- [ ] `/mesh perms list/grant/revoke/audit`

### 3.4 Agent Management Commands
- [ ] `/mesh agent <name> info/restart/pause/resume`

### 3.5 Virtual Teams Integration
- [ ] Map commands to persona permissions
- [ ] Role-based access (Exec/Operator/Viewer)
- [ ] Audit trail to Virtual Teams

---

## Phase 4: Advanced Features [CASSIAN]

**Goal:** Multi-agent orchestration, health monitoring, config management, workflows

📄 **Full Spec:** [`tasks/PHASE-4-ADVANCED-FEATURES.md`](../tasks/PHASE-4-ADVANCED-FEATURES.md)

### 4.1 Multi-Agent Broadcast
- [ ] `/mesh broadcast` with ACK tracking
- [ ] Group targeting, templated messages

### 4.2 Automated Health Monitoring
- [ ] Scheduled health sweeps
- [ ] Alert routing, degradation detection
- [ ] Auto-recovery triggers

### 4.3 Configuration Management
- [ ] `/mesh config view/set/diff/apply/rollback`
- [ ] Version history with diff tracking

### 4.4 Workflow Automation
- [ ] Workflow DSL (sequence, parallel, conditional)
- [ ] Pre-built workflows: daily health check, restart sequence

### 4.5 Evelyn-Specific Extensions
- [ ] Meeting prep intelligence
- [ ] Objection handling library
- [ ] Deal intelligence dashboards

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
| Fill Phase 3-4 tasks | Cassian | Today |
| Review + merge work plan | Both | Today |
| Begin Phase 1.1 | Oracle | After merge |

---

*Enterprise grade. Clear ownership. Parallel execution.*
