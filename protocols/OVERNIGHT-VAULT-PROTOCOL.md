# Overnight Vault Protocol (OVP)

**Version:** 0.1.0-draft  
**Author:** Cassian Sandman (CIO)  
**Date:** 2026-01-30  
**Status:** Draft — pending test run + human approval

---

## 1. Purpose

Enable productive overnight autonomous execution by Virtual Teams agents on Voltagent. Human sets direction before end of work session, agents execute through the night, human reviews on wake.

**Goal:** Turn 8 hours of human sleep into 8 hours of agent productivity.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    OVERNIGHT VAULT PROTOCOL                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [T-2h]         [T-0]           [T+8h]          [T+8h+]         │
│  PREP     →    HANDOFF    →    EXECUTE    →    REVIEW           │
│                                                                  │
│  Human         Human           Voltagent       Human             │
│  + Mesh        signs off       agents          reviews           │
│  agents                        run             outputs           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Role |
|-----------|------|
| **Human (Ely)** | Sets direction, approves work plan, reviews outputs |
| **Mesh Agents (Sandman/Oracle)** | Prep work plan, monitor execution, compile review |
| **Voltagent** | Execution engine — runs the 127 Virtual Teams agents |
| **Neo4j** | Knowledge graph — tracks tasks, relationships, context |
| **Notion** | Task source, Activity Log, deliverable storage |

---

## 3. Protocol Phases

### Phase 1: PREP (T-2h to T-0)

**Owner:** Mesh agents (Sandman + Oracle) with human input

**Steps:**
1. **Pull Tasks** — Query Notion Tasks DB for candidates
2. **Filter for Overnight** — Select tasks matching criteria:
   - Automatable (no mid-task human approval needed)
   - Scoped (clear inputs, success criteria, deliverables)
   - Reversible (or explicitly approved for irreversible)
   - Timeboxed (can complete in <8h)
3. **Assign Agents** — Map tasks to appropriate Voltagent agents
4. **Build Work Plan** — Document in standard format
5. **Human Review** — Present work plan for approval

**Deliverable:** Approved WORK_PLAN.md

---

### Phase 2: HANDOFF (T-0)

**Owner:** Mesh agents

**Steps:**
1. **Log Start** — Create Activity Log entry for execution start
2. **Load Work Plan** — Push to Voltagent via MCP
3. **Initialize Agents** — Activate assigned agents
4. **Set Checkpoints** — Configure cron jobs for status logs
5. **Confirm Execution** — Verify agents are running
6. **Human Sign-off** — Ely confirms and exits

**Deliverable:** Execution confirmation in Telegram + Activity Log

---

### Phase 3: EXECUTE (T-0 to T+8h)

**Owner:** Voltagent agents

**Steps:**
1. **Work Tasks** — Execute assigned work
2. **Log Progress** — Write to Activity Log at checkpoints
3. **Handle Blockers** — Document and move on (no human escalation overnight)
4. **Store Artifacts** — Commit work to appropriate locations
5. **Cross-Agent Coordination** — Use graph for handoffs if needed

**Checkpoints:**
- 25% — Status log
- 50% — Status log + mid-point summary
- 75% — Status log
- 100% — Final summary

**Deliverable:** Completed work + execution log

---

### Phase 4: REVIEW (T+8h+)

**Owner:** Human (Ely) with mesh agent support

**Steps:**
1. **Pull Summary** — Mesh agents compile overnight results
2. **Review Deliverables** — Human evaluates each task output
3. **Categorize:**
   - ✅ **Complete** — Accepted, no action needed
   - 🔄 **Iterate** — Needs revision, queue for next cycle
   - ❌ **Failed** — Blocked, needs human intervention
   - 🎯 **New Tasks** — Spawned from overnight work
4. **Log Review** — Document decisions in Activity Log
5. **Queue Next Cycle** — Feed learnings into next night's prep

**Deliverable:** Review log + iteration queue

---

## 4. Work Plan Format

```markdown
# OVP WORK PLAN — [DATE]

## Metadata
- **Handoff Time:** [UTC timestamp]
- **Expected Review:** [UTC timestamp]
- **Approver:** [Human name]
- **Prep Agents:** [Sandman, Oracle, etc.]

## Constraints
- [ ] No external communications
- [ ] No financial transactions
- [ ] Read-only on [specific DBs]
- [ ] Document-only mode (no modifications without approval)

## Tasks

### Task 1: [Title]
- **Agent:** [Voltagent persona codename]
- **Input:** [What the agent receives]
- **Output:** [Expected deliverable]
- **Success Criteria:** [How to verify completion]
- **Priority:** [HIGH/MED/LOW]
- **Est. Duration:** [Time estimate]

### Task 2: [Title]
...

## Checkpoints
| Time | Milestone |
|------|-----------|
| T+2h | 25% status |
| T+4h | 50% status + summary |
| T+6h | 75% status |
| T+8h | 100% complete |

## If Blocked
- Document the blocker in Activity Log
- Move to next task
- Flag for morning review
- DO NOT escalate to humans overnight (unless pre-approved emergency)
```

---

## 5. Task Selection Criteria

### ✅ Good Overnight Tasks
- Documentation generation/cleanup
- Data validation/audits
- Research (read-only)
- Report generation
- Code review (no commits)
- Protocol gap analysis
- Identity audits
- Content drafts (internal)

### ⚠️ Conditional (Requires Pre-Approval)
- Git commits to approved repos
- Notion page creation (non-critical)
- Internal notifications

### ❌ Not Overnight Tasks
- External communications
- Financial operations
- Production deployments
- Anything requiring mid-task decisions
- Irreversible deletions
- Security-sensitive operations

---

## 6. Agent Selection

Map tasks to agents based on:

| Domain | Primary Agents |
|--------|----------------|
| Documentation | Protocol Office, Continuity Team |
| Research | Research Team, IC Research & Risk |
| Data Analysis | Data Analysis Team |
| Identity Audits | Identity Architecture Office (Vera Ironwood) |
| Content | Social Media Team (SIGNAL UNIT) |
| Legal Review | Bacherman Martin |
| Client Comms (drafts) | Evelyn - Client Orchestration |
| Technical | Product Development Team |

---

## 7. Logging Requirements

### Activity Log Entry (per task)
```
Event: OVP Task [N] — [Title]
Notes: 
  - Agent: [codename]
  - Status: [Started/InProgress/Complete/Blocked]
  - Output: [link or summary]
  - Duration: [actual time]
  - Blockers: [if any]
Logged at: [timestamp]
Type: Overnight Vault Protocol
```

### Summary Log (end of execution)
```
Event: OVP Execution Summary — [DATE]
Notes:
  - Tasks Planned: [N]
  - Tasks Complete: [N]
  - Tasks Blocked: [N]
  - Total Duration: [time]
  - Key Outputs: [list]
  - Issues for Review: [list]
```

---

## 8. Error Handling

| Scenario | Response |
|----------|----------|
| Agent fails to start | Log error, skip task, continue |
| Task takes >2x estimated time | Log warning, continue, flag for review |
| Unexpected error | Log full context, move to next task |
| All tasks blocked | Post summary, stop execution |
| System failure | Cron job will log "no heartbeat" for morning review |

---

## 9. Security Constraints

- All execution within Voltagent sandbox
- No external API calls without pre-approval
- No credential usage beyond pre-configured tokens
- All outputs logged and auditable
- Mesh agents can monitor but not intervene overnight

---

## 10. Metrics

Track over time:
- Tasks completed per night
- Completion rate (completed / planned)
- Block rate (blocked / planned)  
- Human review time (morning)
- Iteration rate (tasks needing rework)
- Value delivered (qualitative assessment)

---

## 11. Evolution

This protocol will iterate based on:
1. Each night's learnings
2. Human feedback on review
3. New capabilities added to Voltagent
4. Expanded task types

Document changes in git, announce to mesh group.

---

## Appendix: Quick Reference

```
┌─────────────────────────────────────────────────┐
│              OVP CHEAT SHEET                   │
├─────────────────────────────────────────────────┤
│ T-2h: Prep work plan with mesh agents          │
│ T-0:  Human approves, signs off                │
│ T+Nh: Voltagent executes, logs checkpoints     │
│ T+8h: Human wakes, reviews with mesh help      │
│                                                │
│ Good tasks: Docs, research, audits, reports    │
│ Bad tasks: External comms, deploys, finances   │
│                                                │
│ If blocked: Document, skip, flag for morning   │
└─────────────────────────────────────────────────┘
```

---

*Draft by Cassian Sandman — 2026-01-30*
