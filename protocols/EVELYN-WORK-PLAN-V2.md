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

**Goal:** *(Cassian to define tasks)*

### 3.1 Persona & Voice
- [ ] *TBD by Cassian*

### 3.2 Routing Logic
- [ ] *TBD by Cassian*

### 3.3 Virtual Team Integration
- [ ] *TBD by Cassian*

---

## Phase 4: Advanced Features [CASSIAN]

**Goal:** *(Cassian to define tasks)*

### 4.1 Meeting Prep
- [ ] *TBD by Cassian*

### 4.2 Objection Handling
- [ ] *TBD by Cassian*

### 4.3 Deal Intelligence
- [ ] *TBD by Cassian*

---

## Shared Responsibilities

### Protocol Definitions
- [ ] Define API contract between phases (Oracle implements, both contribute)
- [ ] Document handoff patterns (Oracle → Cassian at Telegram layer)
- [ ] Create integration test suite (both own their phase tests)

### Testing
- [ ] Oracle: Phase 1-2 unit + integration tests
- [ ] Cassian: Phase 3-4 tests
- [ ] Joint: End-to-end flow testing

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
