# Night Shift Protocol v1.0

*Last updated: 2026-01-31*
*Maintainers: Protocol Office*

---

## Purpose

Defines how work plans get executed autonomously by the "Night Shift" — virtual agent teams loaded on the Voltagent framework that execute pre-approved work while humans are offline.

---

## Concept

```
DAYTIME (Human Active)
    │
    ├── Ely + Agents define work plans
    ├── Deep, robust planning with:
    │     ├── Clear delegation
    │     ├── Checklists
    │     ├── Virtual team assignments
    │     └── Protocol links
    │
    └── Work plans APPROVED for night execution
            │
            ▼
NIGHT SHIFT (Autonomous Execution)
    │
    ├── Voltagent loads virtual team personas
    ├── Executes work plan steps in sequence
    ├── Each persona completes their assigned tasks
    ├── Logs all activity to Work Log
    │
    └── Morning: Deliverables ready for review
```

---

## Requirements for Night Shift Eligibility

A work plan can be executed by Night Shift only if:

1. **Fully specified** — No ambiguous steps
2. **Pre-approved actions only** — Constraints clearly defined
3. **No human dependencies** — No steps requiring real-time human input
4. **Virtual teams assigned** — Each step has a persona owner
5. **Protocols linked** — Every step references applicable protocols
6. **Success criteria defined** — Clear "done" conditions
7. **Rollback plan** — What to do if something fails

---

## Execution Flow

### 1. Plan Submission
- Work plan created in Notion
- Linked from Mesh Work Log
- Status: "Approved for Night Shift"

### 2. Voltagent Load
- Framework loads assigned personas
- Each persona receives their task context
- Sequence order established

### 3. Sequential Execution
```
Persona 1 → Task 1 → Log → Pass to Persona 2
Persona 2 → Task 2 → Log → Pass to Persona 3
...
Final Persona → Final Task → Log → Mark Complete
```

### 4. Logging
Every action logged to:
- Virtual Team Activity Log (per-persona)
- Mesh Work Log (per-project)
- GitHub (if code/docs produced)

### 5. Completion
- Work plan status → "Review"
- Summary posted to Telegram
- Artifacts linked in Notion
- Ready for morning review

---

## Failure Handling

If a step fails:

1. **Log the failure** with error details
2. **Stop execution** (no partial work)
3. **Alert via Telegram** (if critical)
4. **Set status** → "Blocked"
5. **Document blocker** for human review

---

## Roles

| Role | Responsibility |
|------|----------------|
| **Ely** | Approves plans for night execution |
| **Cassian** | Orchestrates, ensures plans are complete |
| **Oracle** | Infrastructure, Voltagent framework |
| **Virtual Teams** | Execute assigned steps |

---

## Virtual Team Night Shift Roster

*(To be populated from Virtual Teams DB)*

| Team | Night Shift Capable | Notes |
|------|---------------------|-------|
| Automation Team | Yes | Funnel/campaign execution |
| Protocol Office | Yes | Audits, reviews |
| Product Dev | Limited | Needs human review |
| BD Team | No | Requires live interaction |

---

## Integration Points

- **Mesh Work Log** — Track night shift runs
- **Work Plans** — Source of execution specs
- **Virtual Team Activity Log** — Persona-level logging
- **Voltagent Framework** — Execution engine
- **Telegram** — Alerts and completion notices

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol |

---

*The Night Shift turns well-planned work into completed deliverables while you sleep.*
