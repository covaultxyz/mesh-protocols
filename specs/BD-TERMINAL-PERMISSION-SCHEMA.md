# BD Terminal Permission Schema
## Access Control Specification

*Owner: Oracle*
*Status: DRAFT*
*Created: 2026-01-31*

---

## 1. Overview

This document defines the permission model for the BD Command Center (Evelyn's terminal). It specifies:
- Who can access what data
- How authentication works
- How authorization is enforced
- Data isolation between BDs

---

## 2. User Tiers

### Tier Matrix

| Tier | Role | Data Access | Actions | Examples |
|------|------|-------------|---------|----------|
| **T1** | BD (Individual) | Own deals, own contacts, own pipeline | CRUD own data, request research, view playbooks | CJ Vincenty |
| **T2** | BD Manager | Team's deals + own deals, aggregated metrics | All T1 + team oversight, assign deals, view team activity | Regional lead |
| **T3** | Admin | All data, all BDs, system config | All T2 + user management, permission assignment, audit logs | Avery Vale, Rowan Sable |
| **S** | System | Full access, no UI | Automation, sync, webhooks | Evelyn, Orion, API integrations |

### Tier Inheritance

```
T3 (Admin) ⊃ T2 (Manager) ⊃ T1 (BD)
```

Higher tiers inherit all permissions of lower tiers.

---

## 3. Data Isolation

### 3.1 The Golden Rule

> A BD can only see data where `assignedBD = self` or `visibility = public`

### 3.2 Isolation Scopes

| Resource | T1 Sees | T2 Sees | T3 Sees |
|----------|---------|---------|---------|
| Deals | `assignedBD = self` | `assignedBD IN team` | All |
| Contacts | `ownedBy = self` | `ownedBy IN team` | All |
| Tasks | `assignee = self` | `assignee IN team` | All |
| Research | `requestedBy = self` | `requestedBy IN team` | All |
| Activity Log | Own activities | Team activities | All activities |
| Playbooks | All (read-only) | All (read-only) | All (CRUD) |
| Virtual Teams | Interact | Interact | Manage |

### 3.3 Filter Injection

All database queries are automatically wrapped with permission filters:

```sql
-- Original query
SELECT * FROM deals WHERE stage = 'negotiation'

-- After filter injection (T1 user: cj_vincenty)
SELECT * FROM deals 
WHERE stage = 'negotiation' 
AND assigned_bd = 'cj_vincenty'

-- After filter injection (T2 user: team_lead_west)
SELECT * FROM deals 
WHERE stage = 'negotiation' 
AND assigned_bd IN (SELECT user_id FROM team_members WHERE team = 'west')
```

---

## 4. Authentication

### 4.1 Auth Methods (Priority Order)

1. **Magic Link** (Primary) — Email-based, no password
2. **SSO/SAML** (Enterprise) — Via Covault IdP when available
3. **Password** (Fallback) — If magic link not viable

### 4.2 Session Model

| Property | Value |
|----------|-------|
| Session token | JWT (RS256) |
| Access token TTL | 1 hour |
| Refresh token TTL | 7 days |
| Storage | HttpOnly cookie (web), secure storage (mobile) |
| Refresh strategy | Silent refresh via /auth/refresh |

### 4.3 JWT Claims

```json
{
  "sub": "user_uuid",
  "email": "cj@covault.xyz",
  "name": "CJ Vincenty",
  "tier": 1,
  "territory": "north_america",
  "team": "west",
  "permissions": ["deals:read", "deals:write", "research:request"],
  "iat": 1706713200,
  "exp": 1706716800
}
```

### 4.4 Magic Link Flow

```
1. User enters email → POST /auth/magic
2. System generates token (32 bytes, 15 min TTL)
3. Email sent: "https://evelyn.covault.xyz/auth/verify?token=xxx"
4. User clicks link → GET /auth/verify?token=xxx
5. Server validates token, creates session, sets cookie
6. Redirect to dashboard
```

---

## 5. Authorization

### 5.1 Permission Strings

Format: `resource:action` or `resource:action:scope`

| Permission | Meaning |
|------------|---------|
| `deals:read` | Read deal data (subject to isolation) |
| `deals:write` | Create/update deals |
| `deals:delete` | Soft-delete deals |
| `deals:read:all` | Read all deals (T3 only) |
| `research:request` | Submit research requests |
| `research:review` | Review/prioritize research queue |
| `users:manage` | Create/update/deactivate users |
| `playbooks:write` | Edit playbooks |
| `audit:read` | View audit logs |
| `system:config` | Modify system settings |

### 5.2 Default Permissions by Tier

```yaml
T1_BD:
  - deals:read
  - deals:write
  - contacts:read
  - contacts:write
  - tasks:read
  - tasks:write
  - research:request
  - playbooks:read

T2_MANAGER:
  - # All T1 permissions
  - deals:read:team
  - tasks:assign
  - reports:team

T3_ADMIN:
  - # All T2 permissions
  - deals:read:all
  - users:manage
  - playbooks:write
  - audit:read
  - system:config
```

### 5.3 Middleware Enforcement

```typescript
// Route protection
router.get('/deals', 
  requireAuth,                    // Must be logged in
  requirePermission('deals:read'), // Must have permission
  injectFilter('deals'),          // Apply data isolation
  dealsController.list
);

// Admin-only route
router.post('/users', 
  requireAuth,
  requireTier(3),                 // Must be T3+
  usersController.create
);
```

---

## 6. Identity Model

### 6.1 BD Profile Schema

```typescript
interface BDProfile {
  id: string;              // UUID
  email: string;           // Primary identifier
  name: string;            // Display name
  tier: 1 | 2 | 3;         // Permission tier
  territory: string;       // Geographic territory (e.g., "north_america")
  team: string | null;     // Team ID (for T2 managers)
  status: 'active' | 'inactive' | 'pending';
  
  // Preferences
  timezone: string;        // IANA timezone
  notificationPrefs: {
    email: boolean;
    telegram: boolean;
    dailyDigest: boolean;
  };
  
  // Metadata
  createdAt: Date;
  lastLoginAt: Date;
  invitedBy: string | null; // Who onboarded them
}
```

### 6.2 Notion Integration

BD profiles sync bidirectionally with Notion:
- Source of truth: Notion "BD Roster" database
- Sync frequency: Real-time webhooks + 15-min reconciliation
- Conflict resolution: Notion wins (it's the HR system)

---

## 7. Onboarding Flow

### 7.1 New BD Provisioning

```
1. Admin creates BD in Notion BD Roster
2. Webhook triggers: POST /hooks/notion/bd-created
3. System:
   a. Creates local BD profile
   b. Generates invite token
   c. Creates filtered views (deals where assignedBD = new_bd)
   d. Sends welcome email with magic link
4. BD clicks link → sets preferences → active
```

### 7.2 Welcome Email Template

```
Subject: Your BD Command Center is Ready

Hey [Name],

You've been added to Evelyn — your deal command center.

Click here to get started: [MAGIC LINK]

Your territory: [Territory]
Your tier: [Tier description]

Questions? Reply to this email.

— The Covault Team
```

---

## 8. Security Considerations

### 8.1 Attack Surface Mitigations

| Threat | Mitigation |
|--------|------------|
| Session hijacking | HttpOnly + Secure + SameSite=Strict cookies |
| CSRF | CSRF token in forms, Origin header validation |
| Privilege escalation | Tier checked on every request, not just login |
| Data leakage | Filter injection is mandatory, not optional |
| Token theft | Short-lived access tokens, refresh token rotation |
| Brute force | Rate limiting on /auth/* endpoints |

### 8.2 Audit Requirements

All permission-sensitive actions are logged:

```json
{
  "timestamp": "2026-01-31T14:00:00Z",
  "actor": "cj_vincenty",
  "action": "deals:write",
  "resource": "deal_uuid",
  "result": "success",
  "ip": "192.168.1.1",
  "userAgent": "...",
  "changes": {
    "stage": {"from": "qualified", "to": "negotiation"}
  }
}
```

### 8.3 Credential Storage

| Secret | Storage |
|--------|---------|
| JWT signing key | `pass show bd-terminal/jwt-secret` |
| Magic link salt | `pass show bd-terminal/magic-salt` |
| Session encryption | `pass show bd-terminal/session-key` |
| Notion API token | `pass show api/notion/covault` |

---

## 9. API Endpoints

### Auth Routes

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/auth/magic` | Request magic link | No |
| GET | `/auth/verify` | Verify magic link token | No |
| POST | `/auth/refresh` | Refresh access token | Refresh token |
| POST | `/auth/logout` | Invalidate session | Yes |
| GET | `/auth/me` | Get current user profile | Yes |

### Admin Routes

| Method | Path | Description | Required Tier |
|--------|------|-------------|---------------|
| GET | `/admin/users` | List all users | T3 |
| POST | `/admin/users` | Create user | T3 |
| PATCH | `/admin/users/:id` | Update user | T3 |
| DELETE | `/admin/users/:id` | Deactivate user | T3 |
| GET | `/admin/audit` | View audit logs | T3 |

---

## 10. Implementation Phases

### Phase 1.1: Auth Core
- [ ] JWT generation/validation
- [ ] Magic link flow
- [ ] Session management
- [ ] /auth/* routes

### Phase 1.2: Permission Engine
- [ ] Tier model
- [ ] Permission checks
- [ ] Filter injection middleware
- [ ] Route protection

### Phase 1.3: Onboarding
- [ ] Notion webhook receiver
- [ ] Welcome email dispatch
- [ ] Filtered view creation
- [ ] Status tracking

### Phase 1.4: Security
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Penetration testing
- [ ] Documentation

---

## 11. Open Questions

1. **SSO timeline** — When will Covault IdP be ready?
2. **Team structure** — How are teams defined? Notion DB or hardcoded?
3. **Deactivation flow** — Soft delete + data retention policy?

---

*v0.1 — Initial permission schema*
