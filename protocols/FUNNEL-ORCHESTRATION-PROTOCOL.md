# Funnel Orchestration Protocol

*Version: 1.0.0*
*Author: Cassian Sandman*
*Date: 2026-02-01*

---

## Purpose

Defines how CROSS_TEAM_ORCHESTRATOR monitors and coordinates funnel project flow through the Funnel Projects DB.

---

## Funnel Projects DB

**ID:** `2fa35e81-2bbb-81e3-90c0-dc584630d171`

### Key Fields to Monitor

| Field | Type | Trigger Condition |
|-------|------|-------------------|
| Status | select | Changed to "Blocked" or "Review" |
| Phase | select | Phase transition (A→B, B→C, C→D) |
| Sub-Step | select | Sub-step completion |
| Due Date | date | Approaching (3 days) or overdue |
| Priority | select | P0 or P1 items |

---

## Orchestration Triggers

### 1. New Intake (Phase A Entry)

**Condition:** New entry created with Phase = "A - Intake"

**Actions:**
1. Validate intake form completeness
2. Assign to intake queue if no Lead Agent
3. Notify LIAISON_CHAIR of new project
4. Log to Activity Log

### 2. Phase Transition

**Condition:** Phase field changes (e.g., A → B)

**Actions:**
1. Validate exit criteria for previous phase
2. Create handoff record
3. Notify receiving team/agent
4. Update project timeline
5. Log transition to Activity Log

### 3. Blocked Status

**Condition:** Status changes to "Blocked"

**Actions:**
1. Extract blocking reason from Notes
2. Notify Lead Agent and backup
3. Escalate if blocked > 24 hours
4. Add to daily standup agenda
5. Log to blockers list

### 4. Due Date Warning

**Condition:** Due Date within 3 days

**Actions:**
1. Send reminder to Lead Agent
2. Check sub-step progress
3. Flag if behind schedule
4. Notify DEAL_DIRECTOR if P0/P1

### 5. Stale Project Detection

**Condition:** Last Updated > 7 days, Status not "Complete"

**Actions:**
1. Ping Lead Agent for status
2. If no response in 24h, escalate
3. Consider reassignment if agent unavailable

---

## Integration Points

### VoltAgent Cron Job

```bash
# Check Funnel Projects every 30 minutes
*/30 * * * * node /root/clawd/voltagent/funnel_monitor.js
```

### Monitoring Script Spec

```javascript
// funnel_monitor.js should implement:

async function checkFunnelProjects() {
  // 1. Query Funnel Projects DB
  // 2. Check each trigger condition
  // 3. Execute corresponding actions
  // 4. Log all activities
}

// Queries needed:
// - New entries in last 30 min
// - Status = Blocked
// - Due Date < now + 3 days
// - Last Updated < now - 7 days
```

---

## Notification Routing

| Trigger | Primary Notify | Secondary | Channel |
|---------|---------------|-----------|---------|
| New Intake | LIAISON_CHAIR | INTAKE_COORDINATOR | Telegram |
| Phase Transition | Receiving Agent | DEAL_DIRECTOR | Telegram |
| Blocked | Lead Agent | Team Lead | Telegram + Notion |
| Due Warning | Lead Agent | DEAL_DIRECTOR | Telegram |
| Stale | Lead Agent | Orchestrator | Telegram |

---

## Metrics to Track

1. **Funnel Velocity:** Average time per phase
2. **Conversion Rate:** % moving from A → D
3. **Block Rate:** % time spent blocked
4. **SLA Compliance:** % meeting due dates

---

## Routing Rules

### Program Type → Builder Assignment

| Program Type | Primary Builder | Backup |
|--------------|-----------------|--------|
| SPV | SOLUTION_PACKAGING_ENGINEER | DEAL_DIRECTOR |
| Fund | FUND_STRUCTURING_TEAM | CFO_OFFICE |
| Tokenization | TOKENIZATION_ARCHITECT | TECH_TEAM |
| Infrastructure | INFRASTRUCTURE_LEAD | DEAL_DIRECTOR |
| Energy | ENERGY_SPECIALIST | INFRASTRUCTURE_LEAD |
| Real Estate | RE_STRUCTURING_TEAM | DEAL_DIRECTOR |

### Phase → Team Assignment

| Phase | Primary Team | Notification |
|-------|-------------|--------------|
| A - Intake | LIAISON_CHAIR | Immediate |
| B - Diligence | RESEARCH_TEAM | On phase entry |
| C - Structuring | DEAL_DIRECTOR | On phase entry + artifacts |
| D - Close | LEGAL_TEAM + CFO | On phase entry |

---

## Phase Transition Triggers

### A → B Transition

**Exit Criteria (A):**
- All intake fields completed
- Required materials received
- Lead agent assigned

**Trigger Actions:**
1. Validate exit criteria
2. Create handoff record
3. Notify RESEARCH_TEAM
4. Assign diligence sub-tasks
5. Log transition

### B → C Transition

**Exit Criteria (B):**
- Diligence checklist complete
- IC memo approved
- No blocking issues

**Trigger Actions:**
1. Validate diligence artifacts
2. Create handoff to structuring
3. Notify DEAL_DIRECTOR
4. Queue legal review
5. Log transition

### C → D Transition

**Exit Criteria (C):**
- Structure approved
- Terms agreed
- Compliance cleared

**Trigger Actions:**
1. Final document prep notification
2. Notify LEGAL_TEAM
3. Notify CFO for funding prep
4. Schedule signing
5. Log transition

---

## Implementation Status

- [x] Funnel Projects DB created
- [x] Intake Form Template created
- [x] Phase Definitions documented
- [x] Handoff Template created
- [x] Orchestration Protocol documented
- [x] funnel_monitor.js implemented
- [x] Routing rules defined
- [x] Phase transition triggers defined
- [ ] Cron job configured
- [ ] Metrics dashboard created
- [ ] End-to-end test completed

---

*Protocol maintained by Intelligence Architecture (CASSIAN_SANDMAN)*
