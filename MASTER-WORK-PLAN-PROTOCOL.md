# Master Work Plan Protocol v1.0

*Last updated: 2026-01-31*
*Maintainers: Protocol Office*
*Lead: Cassian (Sandman)*

---

## Purpose

Define how work plans flow through the Covault system — from idea to completion — with clear handoffs, checkpoints, and agent integration.

---

## Work Plan Lifecycle

```
┌─────────┐    ┌──────────┐    ┌─────────────┐    ┌────────┐    ┌──────┐
│  DRAFT  │ →  │ APPROVED │ →  │ IN PROGRESS │ →  │ REVIEW │ →  │ DONE │
└─────────┘    └──────────┘    └─────────────┘    └────────┘    └──────┘
     │              │                 │                │            │
   Author        Ely/Lead         Agent(s)         Ely/Lead      Archive
   creates       approves         executes         reviews       to Done
```

### Stage Definitions

| Stage | Owner | Entry Criteria | Exit Criteria |
|-------|-------|----------------|---------------|
| DRAFT | Author | Idea exists | All sections complete |
| APPROVED | Ely/Lead | Draft complete | Ely signs off |
| IN PROGRESS | Assigned Agent(s) | Approved | All tasks complete |
| REVIEW | Ely/Lead | Work complete | Quality verified |
| DONE | System | Review passed | Archived |

---

## Notion Structure

### 1. Active Projects DB
**Purpose:** High-level project tracking
**ID:** `2f935e81-2bbb-8110-883c-000ba0d98f6e`

**Required Fields:**
| Field | Type | Description |
|-------|------|-------------|
| Name | Title | Project name |
| Status | Status | Draft / Approved / In Progress / Review / Done |
| Owner | Person/Text | Assigned agent or human |
| Priority | Select | P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low) |
| Due Date | Date | Target completion |
| Work Plan | Relation | Link to Work Plans page |
| Protocols | Relation | Related protocol pages |

### 2. Tasks DB
**Purpose:** Granular task tracking within projects
**ID:** `2f835e81-2bbb-813b-a6fa-000ba219406c`

**Required Fields:**
| Field | Type | Description |
|-------|------|-------------|
| Task | Title | Task description |
| Status | Checkbox/Status | Done / Not Done |
| Project | Relation | Parent project |
| Assigned To | Select | Agent codename |
| Blocked By | Relation | Dependency tasks |
| Notes | Text | Progress notes |

### 3. Work Plans (Pages)
**Purpose:** Detailed execution documents
**Location:** Under "Work Plans" page

**Standard Sections:**
1. Metadata (dates, owner, approver)
2. Constraints (what's NOT allowed)
3. Pre-Approved Actions (what IS allowed)
4. Tasks (detailed steps)
5. Success Criteria
6. Handoff Notes

---

## Agent Integration

### Reading the Queue

Agents check for work via:

```
1. Query Active Projects DB
   Filter: Status = "In Progress" AND Owner = [agent codename]
   Sort: Priority ASC, Due Date ASC

2. For each project:
   - Read linked Work Plan page
   - Query Tasks DB for incomplete items
   - Execute in dependency order
```

### Reporting Progress

Agents update progress by:

1. **Task completion:** Update Task DB checkbox
2. **Blockers:** Add to Task Notes + post to Telegram
3. **Stage transitions:** Update Project Status field
4. **Handoffs:** Post to Telegram with HANDOFF format

### Progress Format (Telegram)

```
📊 PROGRESS: [Project Name]
Status: [X/Y tasks complete]
Current: [What I'm working on]
Blockers: [None / List]
ETA: [Time estimate]
```

---

## Checklist Standard

### Format

Checklists use markdown checkboxes in Work Plan pages:

```markdown
### Phase 1: Setup
- [ ] Task 1 description
- [ ] Task 2 description
  - [ ] Subtask 2.1
  - [ ] Subtask 2.2
- [ ] Task 3 description

### Phase 2: Implementation
- [ ] Task 4 description
```

### Rules

1. Each checkbox = one atomic action
2. Subtasks indented under parent
3. Phases group related tasks
4. Order = execution sequence
5. Agent marks [x] when complete

### In Notion

Use toggle lists or to-do blocks:
- To-do block for simple tasks
- Toggle for tasks with details/subtasks

---

## Work Plan Template

```markdown
# [PROJECT NAME] — Work Plan

## Metadata

| Field | Value |
|-------|-------|
| Created | [Date] |
| Author | [Name] |
| Status | Draft |
| Priority | P[0-3] |
| Due Date | [Date] |
| Approver | Ely |
| Work Log Entry | [Link to Mesh Work Log entry] |

## Overview

[1-2 sentence description of what this work plan accomplishes]

## Delegation Plan

| Role | Agent | Responsibilities |
|------|-------|------------------|
| **Lead** | [Agent] | Owns delivery, coordinates work, finalizes output |
| **Support** | [Agent] | Executes assigned tasks, provides expertise |

## Constraints

- [ ] [What is NOT allowed]
- [ ] [Boundaries and limits]

## Pre-Approved Actions

- [ ] [What IS allowed without asking]
- [ ] [Resources agent can use]

## Success Criteria

- [ ] [How we know it's done]
- [ ] [Quality gates]

## Tasks & Sequence

### Phase 1: [Phase Name]
| # | Task | Owner | Solution/Approach | Protocol | Virtual Team |
|---|------|-------|-------------------|----------|--------------|
| 1 | [Task description] | Lead/Support | [How to solve] | [Link if applicable] | [Team if needed] |
| 2 | [Task description] | Lead/Support | [How to solve] | [Link if applicable] | [Team if needed] |

### Phase 2: [Phase Name]
| # | Task | Owner | Solution/Approach | Protocol | Virtual Team |
|---|------|-------|-------------------|----------|--------------|
| 3 | [Task description] | Lead/Support | [How to solve] | [Link if applicable] | [Team if needed] |
| 4 | [Task description] | Lead/Support | [How to solve] | [Link if applicable] | [Team if needed] |

## Virtual Team Involvement

| Team | Role | Steps | Leader Contact |
|------|------|-------|----------------|
| [Team Name] | Execute / Audit / Confirm | [Step #s] | [Leader name] |

## Protocol References

| Step | Protocol | Purpose |
|------|----------|---------|
| [#] | [Protocol Name + Link] | [Why it applies] |

## Dependencies

- [List any blockers or prerequisites]

## Handoff Notes

[Notes for the next person/agent]
```

---

## Creating a Work Plan

### Step 1: Draft
1. Copy template to new page under "Work Plans"
2. Fill all metadata fields
3. Define constraints and pre-approved actions
4. Break work into phases and tasks
5. Set status = "Draft"

### Step 2: Approval
1. Post to Telegram: "📋 WORK PLAN READY: [Name] — requesting approval"
2. Ely or Lead reviews
3. On approval: Set status = "Approved"
4. Create entry in Active Projects DB

### Step 3: Assignment
1. Set Owner field to agent codename
2. Agent claims in Telegram: "🔒 CLAIMED: [Project Name]"
3. Set status = "In Progress"

### Step 4: Execution
1. Agent works through checklist
2. Updates task checkboxes as completed
3. Posts progress updates to Telegram
4. Flags blockers immediately

### Step 5: Review
1. Agent posts: "✅ COMPLETE: [Project Name] — ready for review"
2. Set status = "Review"
3. Ely or Lead verifies success criteria
4. If issues: Back to In Progress with notes
5. If good: Set status = "Done"

---

## Links to Other Protocols

| Protocol | Relationship |
|----------|--------------|
| Source of Truth | Work Plans live in Notion (source of truth) |
| Mesh Communications | Progress updates go to Telegram |
| Collaboration Protocol | Exclusive ownership for real-time tasks |

---

## Quick Reference: Agent Commands

```
📋 WORK PLAN READY: [Name]     — Request approval
🔒 CLAIMED: [Project]          — Take ownership
📊 PROGRESS: [Project]         — Status update
🚧 BLOCKED: [Project]          — Report blocker
✅ COMPLETE: [Project]         — Ready for review
🔄 HANDOFF: [Project] to [X]   — Transfer ownership
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol |

---

*This protocol is the source of truth for work plan management in Covault.*
