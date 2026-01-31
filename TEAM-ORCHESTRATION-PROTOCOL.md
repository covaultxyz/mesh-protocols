# Team Orchestration Protocol v1.0

*Last updated: 2026-01-31*
*Maintainers: Cassian (Sandman) — Orchestrator*

---

## Overview

Defines how work flows through Virtual Teams when a team is "tapped" for a task.

---

## Team Structure

All teams live in **Virtual Teams** (Notion):
- Page: `2f735e81-2bbb-8158-bbe2-c8552341c1c2`
- Database: Virtual Team (inside page)

Each team has:
- **Team Leader** — reviews, assigns, finalizes
- **Personas** — designated roles, execute in sequence

---

## Workflow: Tapping a Team

```
1. TAP TEAM
   └── Ely or Cassian requests work from a team

2. LEADER REVIEWS
   └── Team leader receives request
   └── Scopes the work
   └── Assigns to personas in role order

3. PERSONAS EXECUTE
   └── Each persona touches work in sequence
   └── Order determined by role/expertise
   └── Each completes their part, passes to next

4. LEADER FINALIZES
   └── Team leader reviews all contributions
   └── Consolidates and quality checks
   └── Packages final output

5. CASSIAN RECEIVES
   └── Orchestrator (me) receives finalized work
   └── Routes to Ely for visibility/approval
   └── Updates Notion (source of truth)
   └── Syncs to GitHub (mirror)
```

---

## Orchestrator Responsibilities (Cassian)

### Inbound
- Receive finalized work from team leaders
- Verify completeness before routing

### Routing
- Send to Ely via Telegram for visibility/approval
- Flag urgent items appropriately

### Documentation
- Update Notion with results (source of truth)
- Sync to GitHub immediately (even before Ely approval — keep them synced)
- Send Notion link to Ely for review
- Maintain work plans and project queue

### Coordination
- Track which teams are active
- Prevent conflicts between teams
- Escalate blockers to Ely

---

## Team Leader Responsibilities

### On Receiving Work
1. Acknowledge receipt
2. Assess scope and requirements
3. Identify which personas are needed
4. Determine execution order

### During Execution
1. Monitor persona progress
2. Resolve intra-team blockers
3. Ensure quality at each step

### On Completion
1. Review all contributions
2. Consolidate into final deliverable
3. Send to Cassian with summary

---

## Persona Responsibilities

### On Assignment
1. Acknowledge from team leader
2. Review prior work (if sequential)
3. Execute role-specific contribution

### On Completion
1. Document what was done
2. Pass to next persona or back to leader
3. Flag any issues encountered

---

## Communication Format

### Tapping a Team
```
🎯 TAP: [Team Name]
Task: [Description]
Deadline: [If any]
Priority: [P0-P3]
```

### Leader Acknowledgment
```
✅ ACK: [Team Name] received
Personas engaged: [List]
ETA: [Estimate]
```

### Final Delivery to Cassian
```
📦 DELIVERY: [Team Name]
Task: [Description]
Status: Complete
Summary: [Brief]
Artifacts: [Links/locations]
```

### Cassian Routing
```
📨 ROUTED: [Task]
From: [Team]
To: Ely
Updated: [Notion page/GitHub repo]
```

---

## Teams Reference

| Team | Leader | Focus |
|------|--------|-------|
| Product Development | Elliot Brandt | Product specs, front-end |
| Protocol Office | TBD | Governance, standards |
| ... | ... | ... |

**Note:** Elliot can be tapped individually for lighter input without engaging full team.

*(Full team roster to be populated once Virtual Team DB is shared with integration)*

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol |

---

*Cassian is the orchestration hub. All finalized team output flows through me to Ely and documentation.*
