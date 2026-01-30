# BD Terminal Permission Schema

**Version:** 1.0.0  
**Author:** Cassian Sandman (CIO)  
**Date:** 2026-01-30  
**Status:** Active

---

## 1. Purpose

Define the standard permission model for Business Development (BD) terminals — scoped workspaces that allow external capital connectors to interact with the Covault OS without accessing internal systems.

---

## 2. BD Roles

| Role | Description | Examples |
|------|-------------|----------|
| **Capital Connector** | Sources deals, makes intros, earns referral fees | CJ Vincenty, Julien Charles |
| **Broker Partner** | Licensed broker with deal flow agreement | Grotto, future partners |
| **Strategic Partner** | Co-development or co-sell relationship | TBD |

---

## 3. Permission Tiers

### Tier 1: Capital Connector (CJ, Julien Charles)

**CAN ACCESS:**
| Resource | Scope | Actions |
|----------|-------|---------|
| Their Deal Pipeline | Deals they sourced/own | View, update status, add notes |
| Their Tasks | Tasks assigned to them | View, complete, request help |
| Approved Collateral | Decks, one-pagers (approved set) | View, download, share |
| Their ICP Contacts | Contacts they're working | Add, update, log activity |
| Their Campaign Metrics | Campaigns they're running | View stats |
| Request Channel | Support/material requests | Submit requests |

**CANNOT ACCESS:**
| Resource | Reason |
|----------|--------|
| Other BD deals | Territory isolation |
| Internal strategy | Competitive sensitivity |
| Financial models | Confidential |
| Cap tables / terms | Until deal-specific need |
| IC communications | Internal governance |
| Full Virtual Teams | Internal operations |
| Protocol/architecture | Internal infrastructure |
| Raw research | Curated briefings only |

---

### Tier 2: Broker Partner (Grotto, future)

*Same as Tier 1, plus:*

**ADDITIONAL ACCESS:**
| Resource | Scope | Actions |
|----------|-------|---------|
| Deal Economics | Commission structure | View |
| Pipeline Dashboard | Aggregate (anonymized) | View |
| Co-branded Materials | Joint collateral | View, share |
| Partner Portal | Dedicated section | Full access |

---

### Tier 3: Strategic Partner

*Custom per partnership — requires explicit definition.*

---

## 4. Terminal Structure (Notion Implementation)

```
/[BD-NAME]-BD-Desk/
├── 📊 Dashboard
│   └── Pipeline summary, key metrics, quick actions
│
├── 💼 My Deals
│   └── Database view filtered to assignedBD = [this BD]
│   └── Fields: Company, Stage, Value, Next Step, Last Activity
│
├── 👥 My Contacts  
│   └── CRM view filtered to their contacts
│   └── Fields: Name, Company, Title, Last Touch, Status
│
├── 📄 Collateral
│   └── Approved materials only
│   └── Organized by: Program (Innov8, FNF, VZ) + Type (Deck, One-pager)
│
├── ✅ My Tasks
│   └── Tasks DB filtered to assignedTo = [this BD]
│   └── Fields: Task, Due, Status, Related Deal
│
├── 📊 My Campaigns
│   └── Campaign metrics for their sequences
│   └── Fields: Campaign, Sent, Opens, Replies, Meetings
│
├── 📬 Requests
│   └── Form to submit requests (routes to Liaison Team)
│   └── Request types: Material, Support, Escalation, Other
│
├── 📖 Playbook
│   └── BD-specific guidance
│   └── ICP definitions, pitch scripts, objection handling
│
└── 📞 Contacts & Support
    └── How to reach internal team
    └── Escalation paths
```

---

## 5. Database Filter Patterns

### Deals Database
```
Filter: assignedBD = "[BD Name]"
Visible fields: Company, Stage, Value, NextStep, LastActivity, Notes
Hidden fields: InternalNotes, ICStatus, TermSheet, FinancialModel
```

### Tasks Database
```
Filter: assignedTo contains "[BD Name]"
Visible fields: Task, DueDate, Status, RelatedDeal, Priority
Hidden fields: InternalContext, ReviewNotes
```

### Contacts Database
```
Filter: ownedBy = "[BD Name]" OR sharedWith contains "[BD Name]"
Visible fields: Name, Company, Title, Email, Phone, LastTouch, Status
Hidden fields: InternalScore, ICPMatch, SensitiveNotes
```

---

## 6. Onboarding Checklist

### For each new BD:

**Setup (Internal — do before sharing):**
- [ ] Create BD Desk page from template
- [ ] Set up database views with correct filters
- [ ] Populate collateral section with approved materials
- [ ] Create their playbook with relevant ICPs
- [ ] Add initial tasks (if any)
- [ ] Test all views to confirm filtering works

**Share (With BD):**
- [ ] Share BD Desk page only (not parent)
- [ ] Send login/access instructions
- [ ] Schedule onboarding call
- [ ] Walk through terminal structure
- [ ] Confirm they can see only their data

**Activate:**
- [ ] Add initial deals to pipeline
- [ ] Assign first tasks
- [ ] Connect campaign tracking
- [ ] Set up regular check-in cadence

---

## 7. Audit & Compliance

### Quarterly Review:
- [ ] Verify filter integrity (no data leakage)
- [ ] Review BD activity (are they using it?)
- [ ] Update collateral (remove stale, add new)
- [ ] Check request logs (any patterns?)

### Red Flags:
- BD asking for access beyond their scope
- Unusual data export activity
- Sharing credentials
- Inactive for >30 days

---

## 8. Template

**BD Desk Template Location:** `/templates/BD-DESK-TEMPLATE`

Clone and customize for each new BD:
1. Duplicate template
2. Rename to `[BD-NAME]-BD-Desk`
3. Update all filter references to new BD name
4. Customize playbook for their vertical/territory
5. Share with BD

---

## 9. Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│              BD TERMINAL PERMISSION CHEAT SHEET             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ CAN ACCESS:              ❌ CANNOT ACCESS:              │
│  ─────────────               ────────────────               │
│  Their deals                 Other BD deals                 │
│  Their tasks                 Internal strategy              │
│  Their contacts              Financial models               │
│  Approved collateral         IC communications              │
│  Their campaign stats        Virtual Teams                  │
│  Request channel             Raw research                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FILTER PATTERN: assignedBD = "[BD Name]"                  │
│  SHARE: BD Desk page only, not parent                       │
│  AUDIT: Quarterly filter + activity review                  │
└─────────────────────────────────────────────────────────────┘
```

---

*Created by Cassian Sandman — 2026-01-30*
