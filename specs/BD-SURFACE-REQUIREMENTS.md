# BD Surface Requirements

*Version: 1.0.0-DRAFT*
*Author: Cassian Sandman*
*Date: 2026-02-01*
*Status: DRAFT — Pending CJ Review*

---

## 1. Executive Summary

The BD Surface is a unified interface for Business Development operations, connecting pipeline management, campaign execution, and research coordination into a single operational view.

---

## 2. Current BD Process Map (1.2)

### 2.1 Pipeline Management Flow

```
Lead Generation
    │
    ├─→ Inbound (referrals, website, events)
    ├─→ Outbound (campaigns, cold outreach)
    │
    ▼
Lead Qualification
    │
    ├─→ Initial Contact
    ├─→ Discovery Call
    ├─→ Needs Assessment
    │
    ▼
Pipeline Stages
    │
    ├─→ Lead → Contacted → Meeting Set → Proposal → Diligence → Closing → Won/Lost
    │
    ▼
Handoff to Deal Team
```

### 2.2 Current Tools

| Tool | Purpose | Pain Point |
|------|---------|------------|
| Notion BD Pipeline | Track prospects | Manual updates, no automation |
| Notion BD Campaigns | Track outreach | Disconnected from pipeline |
| Notion Research Requests | Request research | Manual routing |
| Email/Calendar | Scheduling | No integration |
| Telegram | Team comms | No structured workflow |

### 2.3 Current Handoffs

| From | To | Trigger | Method |
|------|-----|---------|--------|
| BD | Research | Need prospect intel | Manual Notion entry |
| BD | Campaign | Need outreach sequence | Manual request |
| BD | Deal Team | Prospect ready for diligence | Manual handoff |
| Campaign | BD | Response received | Manual notification |
| Research | BD | Research complete | Manual notification |

### 2.4 Identified Gaps

1. **No unified view** — Must check multiple DBs
2. **Manual routing** — All handoffs are manual
3. **No automation triggers** — Stale prospects not flagged
4. **Limited visibility** — Campaign performance not linked to pipeline
5. **Research lag** — Requests not prioritized by deal stage

---

## 3. Feature Requirements (1.3)

### 3.1 Core Features (P0)

| Feature | Description | User Story |
|---------|-------------|------------|
| **Pipeline Dashboard** | Unified view of all prospects by stage | "I want to see my entire pipeline at a glance" |
| **Prospect Detail** | Full prospect view with related campaigns/research | "I want all prospect info in one place" |
| **Quick Actions** | One-click to request research, trigger outreach | "I want to take action without switching tools" |
| **Activity Feed** | Recent changes across pipeline | "I want to know what changed since yesterday" |

### 3.2 Automation Features (P1)

| Feature | Description | Trigger |
|---------|-------------|---------|
| **Stale Prospect Alert** | Flag prospects with no contact in 7+ days | Cron check |
| **Stage Change Notification** | Notify team on prospect stage change | DB update |
| **Research Auto-Route** | Route research requests to Research Team | New request |
| **Campaign Response Tracking** | Link campaign responses to prospects | Campaign event |

### 3.3 Reporting Features (P2)

| Feature | Description |
|---------|-------------|
| **Pipeline Velocity** | Average time per stage |
| **Conversion Rates** | Stage-to-stage conversion |
| **Campaign ROI** | Responses/conversions per campaign |
| **Research Turnaround** | Time from request to delivery |

### 3.4 Integration Features (P2)

| Feature | Description |
|---------|-------------|
| **Calendar Sync** | Pull meeting data into prospect timeline |
| **Email Integration** | Log email touchpoints |
| **Telegram Bot** | Quick updates from mobile |

---

## 4. Permission Model (1.4)

### 4.1 Roles

| Role | Description | Personas |
|------|-------------|----------|
| **BD Lead** | Full access, can assign, approve | DEAL_DIRECTOR, BD_LEAD |
| **BD Rep** | Manage own prospects, request research | BD_REP, LIAISON_CHAIR |
| **Research** | View prospects, fulfill research requests | RESEARCH_TEAM |
| **Campaign** | View prospects, manage campaigns | CAMPAIGN_MANAGER |
| **Viewer** | Read-only access | EXEC, ANALYST |

### 4.2 Permission Matrix

| Action | BD Lead | BD Rep | Research | Campaign | Viewer |
|--------|---------|--------|----------|----------|--------|
| View pipeline | ✅ | ✅ (own) | ✅ | ✅ | ✅ |
| Edit prospect | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| Change stage | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| Assign prospect | ✅ | ❌ | ❌ | ❌ | ❌ |
| Request research | ✅ | ✅ | ❌ | ❌ | ❌ |
| Fulfill research | ✅ | ❌ | ✅ | ❌ | ❌ |
| Create campaign | ✅ | ❌ | ❌ | ✅ | ❌ |
| View reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export data | ✅ | ❌ | ❌ | ❌ | ❌ |

### 4.3 Data Visibility

| Data | BD Lead | BD Rep | Research | Campaign | Viewer |
|------|---------|--------|----------|----------|--------|
| All prospects | ✅ | ❌ | ✅ | ✅ | ✅ |
| Own prospects | ✅ | ✅ | ✅ | ✅ | ✅ |
| Deal values | ✅ | ✅ (own) | ❌ | ❌ | ✅ |
| Contact details | ✅ | ✅ | ✅ | ✅ | ❌ |
| Internal notes | ✅ | ✅ (own) | ❌ | ❌ | ❌ |

---

## 5. Technical Architecture

### 5.1 Data Sources

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  BD Pipeline    │    │  BD Campaigns   │    │    Research     │
│  (Notion DB)    │    │  (Notion DB)    │    │  Requests DB    │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   BD Surface API      │
                    │  (bd_surface_*.js)    │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    ┌─────────▼──────┐ ┌───────▼───────┐ ┌──────▼──────┐
    │  CLI Views     │ │  Telegram Bot │ │  Web UI     │
    │  (terminal)    │ │  (future)     │ │  (future)   │
    └────────────────┘ └───────────────┘ └─────────────┘
```

### 5.2 Existing Components

| Component | Status | Description |
|-----------|--------|-------------|
| `bd_surface_connector.js` | ✅ Built | DB connections, unified data model |
| `bd_surface_views.js` | ✅ Built | CLI dashboard views |
| `bd_surface_routing.js` | ✅ Built | Team routing for actions |

### 5.3 Needed Components

| Component | Priority | Description |
|-----------|----------|-------------|
| `bd_surface_monitor.js` | P1 | Cron-based stale detection, alerts |
| `bd_surface_actions.js` | P1 | Quick action handlers |
| Telegram integration | P2 | Bot commands for mobile access |
| Web UI | P3 | Browser-based dashboard |

---

## 6. Success Criteria

### 6.1 MVP (Phase 1)

- [ ] BD team can view full pipeline from single interface
- [ ] One-click research requests with auto-routing
- [ ] Stale prospect alerts working
- [ ] Stage change notifications working

### 6.2 Full Release

- [ ] Campaign performance visible in prospect view
- [ ] Research turnaround tracked
- [ ] Pipeline velocity metrics available
- [ ] CJ approves for daily use

---

## 7. Open Questions for CJ

1. What's your current daily BD workflow? What do you check first?
2. What information is hardest to find right now?
3. How do you currently prioritize which prospects to contact?
4. What would make research requests faster/better?
5. Do you need mobile access? What actions from mobile?

---

## 8. Implementation Status

- [x] 1.2 Map current BD process ← DRAFT
- [x] 1.3 Define feature requirements ← DRAFT
- [x] 1.4 Design permission model ← DRAFT
- [ ] 1.1 Interview CJ (validate/refine above)
- [ ] 1.5 Create wireframes/mockups

---

*DRAFT — Pending review by CJ and BD team*
*Author: Cassian Sandman*
