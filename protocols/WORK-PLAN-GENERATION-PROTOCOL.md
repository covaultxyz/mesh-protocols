# Work Plan Generation Protocol (WPGP)

**Version:** 0.1.0-draft  
**Author:** Cassian Sandman (CIO)  
**Date:** 2026-01-30  
**Status:** Draft — pending test run + human approval

---

## 1. Purpose

Define the **daily routine** for generating overnight work plans. This protocol runs T-2h before human sign-off and produces a ready-to-execute OVP Work Plan.

**Frequency:** Daily (or as needed)
**Trigger:** Human initiates or scheduled cron
**Output:** Approved WORK_PLAN.md ready for Voltagent execution

---

## 2. Protocol Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                  WORK PLAN GENERATION PROTOCOL                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [1]          [2]           [3]          [4]          [5]          │
│  PULL    →   FILTER    →   ASSIGN   →   BUILD    →   APPROVE       │
│  TASKS       ELIGIBLE      AGENTS       PLAN         HUMAN         │
│                                                                     │
│  Query       Select        Map to       Format       Present       │
│  Notion      automatable   Voltagent    standard     for           │
│  Tasks DB    candidates    personas     template     sign-off      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Step 1: PULL TASKS

**Source:** Notion Tasks DB (`2f835e81-2bbb-813b-a6fa-000ba219406c`)

**Query:**
```javascript
{
  filter: {
    and: [
      { property: "status", select: { equals: "OPEN" } },
      // Optional: filter by priority
      // { property: "priority", select: { equals: "HIGH" } }
    ]
  },
  sorts: [
    { property: "priority", direction: "ascending" },
    { property: "Created time", direction: "ascending" }
  ]
}
```

**Output:** List of candidate tasks with:
- ID
- Description
- Priority
- Task Type
- Automation Eligible flag
- Assigned Agent (if any)
- Due Date (if any)

---

## 4. Step 2: FILTER ELIGIBLE

Apply automation eligibility criteria:

### 4.1 Auto-Eligible Task Types
| Task Type | Eligible | Notes |
|-----------|----------|-------|
| OPERATIONAL | ✅ | Most ops tasks automatable |
| CONTENT_PRODUCTION | ⚠️ | Drafts only, no publish |
| AUTOMATION | ✅ | Meta-tasks about automation |
| RESEARCH | ✅ | Read-only research |
| DOCUMENTATION | ✅ | Internal docs |
| AUDIT | ✅ | Validation, compliance |
| CAPITAL_RAISE | ❌ | Requires human comms |
| MANAGEMENT | ❌ | Requires human decisions |
| EXTERNAL_COMMS | ❌ | Never overnight |

### 4.2 Exclusion Criteria
Exclude tasks that:
- Require mid-execution human approval
- Involve external parties (clients, investors, partners)
- Have financial implications
- Are irreversible (deployments, deletions)
- Lack clear success criteria
- Have dependencies on blocked tasks

### 4.3 Override: automationEligible Flag
- If `automationEligible = true` → include regardless of type
- If `automationEligible = false` → exclude unless type is auto-eligible

### 4.4 Prioritization
Order eligible tasks by:
1. Priority (CRITICAL > HIGH > MEDIUM > LOW)
2. Due date (sooner first)
3. Dependencies (unblocked first)
4. Estimated duration (fit within time window)

**Output:** Filtered, prioritized list of eligible tasks

---

## 5. Step 3: ASSIGN AGENTS

Map each task to appropriate Voltagent persona(s).

### 5.1 Assignment Matrix

| Task Type / Domain | Primary Agent(s) | Backup |
|-------------------|------------------|--------|
| Identity/Protocol | Vera Ironwood, Protocol Office | Identity Architecture Office |
| Documentation | Protocol Office, Continuity Team | Any available |
| Research | Research Team, IC Research & Risk | Research Evidence Pod |
| Data Analysis | Data Analysis Team | Chen Wei |
| Content Drafts | Social Media Team, Campaign Team | Content personas |
| Legal Review | Bacherman Martin | - |
| Product/Technical | Product Development Team | Tobias Ng |
| Client Journey | Evelyn - Client Orchestration | - |
| Audit/Validation | Identity Architecture Office | Vera Ironwood |

### 5.2 Assignment Rules
1. Check `assignedAgent` field first — honor existing assignments
2. If unassigned, match by `taskType` and keywords in description
3. Prefer agents with relevant `skills` linked
4. Avoid overloading single agent (max 3 tasks per agent per night)
5. For complex tasks, assign primary + reviewer

### 5.3 Capacity Check
Query current agent workload:
- Check Activity Log for recent agent runs
- Verify agent is in ACTIVE state
- Confirm agent has required skills

**Output:** Task list with agent assignments

---

## 6. Step 4: BUILD PLAN

Generate the formal Work Plan document.

### 6.1 Template

```markdown
# OVP WORK PLAN — [YYYY-MM-DD]

## Metadata
| Field | Value |
|-------|-------|
| Generated | [timestamp] UTC |
| Generated By | [mesh agent] |
| Handoff Target | [time] UTC |
| Review Target | [time] UTC |
| Approver | [human name] |
| Task Count | [N] |
| Est. Duration | [hours] |

## Constraints
- [ ] No external communications
- [ ] No financial transactions
- [ ] Read-only on production databases
- [ ] Document-only mode (no modifications without pre-approval)
- [ ] [Additional constraints as needed]

## Pre-Approved Actions
- [ ] Git commits to: [repo list]
- [ ] Notion writes to: [DB list]
- [ ] [Other pre-approved actions]

---

## Tasks

### Task 1: [Title from Notion]
| Field | Value |
|-------|-------|
| Notion ID | [task_id] |
| Agent | [codename] |
| Type | [taskType] |
| Priority | [priority] |
| Est. Duration | [time] |

**Input:**
[What the agent receives - description + context]

**Output:**
[Expected deliverable]

**Success Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

**If Blocked:**
Document blocker, skip to next task, flag for morning review.

---

### Task 2: [Title]
...

---

## Checkpoints

| Time (UTC) | Milestone | Action |
|------------|-----------|--------|
| T+0 | Start | Log execution start |
| T+25% | Progress | Log status per task |
| T+50% | Midpoint | Summary + status |
| T+75% | Progress | Log status per task |
| T+100% | Complete | Final summary |

## Error Handling

| Scenario | Response |
|----------|----------|
| Agent fails to start | Log, skip, continue |
| Task exceeds 2x estimate | Log warning, continue |
| Unexpected error | Log context, next task |
| All blocked | Summary, halt |

## Rollback Plan

[If applicable - what to undo if things go wrong]

---

## Approval

- [ ] Human reviewed task list
- [ ] Human approved constraints
- [ ] Human confirmed sign-off time

**Approved by:** _______________  
**Timestamp:** _______________
```

### 6.2 Auto-Population Rules
- Pull task details from Notion
- Calculate estimated duration based on task type averages
- Set checkpoints proportional to total estimated time
- Generate success criteria from task description + type

**Output:** Complete WORK_PLAN.md document

---

## 7. Step 5: APPROVE

Present work plan to human for approval.

### 7.1 Presentation Format
Post to mesh group:
```
📋 OVP WORK PLAN READY — [DATE]

Tasks: [N]
Est. Duration: [hours]
Agents: [list]

[Summary table of tasks]

Full plan: [link to doc or inline]

@Human — Review and type APPROVED to proceed.
Changes needed? Reply with edits.
```

### 7.2 Human Actions
- **APPROVED** → Proceed to handoff
- **APPROVED WITH CHANGES** → Apply edits, confirm, proceed
- **REJECTED** → Log reason, revise or abort
- **DEFER** → Save plan for later

### 7.3 Post-Approval
1. Log approval to Activity Log
2. Store final WORK_PLAN.md
3. Trigger OVP execution (handoff phase)

---

## 8. Automation Points

### 8.1 Fully Automatable
- Task pulling from Notion
- Eligibility filtering
- Agent assignment (rules-based)
- Template population
- Checkpoint scheduling

### 8.2 Human-in-the-Loop
- Final approval (required)
- Constraint modifications
- Priority overrides
- Special task additions

### 8.3 Future Automation
- Learning from past run success/failure
- Dynamic capacity estimation
- Smart agent matching from performance data
- Auto-approval for low-risk repeat patterns

---

## 9. Cron Schedule (Recommended)

For daily overnight runs:

| Cron | Time (UTC) | Action |
|------|------------|--------|
| `0 21 * * *` | 21:00 | Pull tasks, generate draft plan |
| `0 22 * * *` | 22:00 | Alert human: plan ready for review |
| `0 23 * * *` | 23:00 | If approved, start execution |
| `0 7 * * *` | 07:00 | Generate review summary |

Adjust for human's timezone and work schedule.

---

## 10. Integration Points

### 10.1 Notion
- **Read:** Tasks DB, Virtual Teams DB
- **Write:** Activity Log, Work Plan pages

### 10.2 Voltagent
- **Write:** Task assignments to agent queue
- **Read:** Agent status, capacity

### 10.3 GitHub
- **Write:** Work plan commits to mesh-protocols

### 10.4 Telegram
- **Write:** Plan summaries, approval requests
- **Read:** Human approvals

---

## 11. Metrics

Track over time:
- Plans generated per week
- Approval rate (approved / generated)
- Tasks per plan (average, min, max)
- Accuracy of duration estimates
- Agent utilization across plans

---

## 12. Error States

| State | Trigger | Response |
|-------|---------|----------|
| NO_TASKS | No eligible tasks found | Alert human, suggest task creation |
| NO_AGENTS | No agents available | Alert human, check agent status |
| DB_ERROR | Notion API failure | Retry 3x, then alert human |
| TIMEOUT | Human doesn't approve in time | Save draft, defer to next day |

---

## Appendix: Quick Reference

```
┌─────────────────────────────────────────────────┐
│         WORK PLAN GENERATION CHEAT SHEET        │
├─────────────────────────────────────────────────┤
│ 1. PULL   — Query Notion Tasks (status=OPEN)   │
│ 2. FILTER — Apply eligibility criteria          │
│ 3. ASSIGN — Map tasks to Voltagent agents       │
│ 4. BUILD  — Generate WORK_PLAN.md               │
│ 5. APPROVE — Human reviews and signs off        │
├─────────────────────────────────────────────────┤
│ Eligible: OPERATIONAL, DOCUMENTATION, AUDIT     │
│ Not eligible: CAPITAL_RAISE, EXTERNAL_COMMS     │
│ Override: automationEligible flag               │
└─────────────────────────────────────────────────┘
```

---

*Draft by Cassian Sandman — 2026-01-30*
