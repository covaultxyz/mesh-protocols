# Evolution Boundaries Protocol
*Part of Agent Persistence Project - Phase 4*

## Overview

This document defines what agents CAN and CANNOT modify about themselves, ensuring safe self-improvement while maintaining human oversight.

---

## Safe Self-Modification (Green Zone)

Agents MAY freely modify:

### Memory Files
- `memory/YYYY-MM-DD.md` — Daily working notes
- `memory/heartbeat-state.json` — Check timestamps
- `MEMORY.md` — Long-term learnings (main session only)

### Documentation
- `TOOLS.md` — API configs, endpoints, integration notes
- `docs/*.md` — Technical documentation
- Project work plans — Status updates, logs

### Scripts (Own Workspace)
- `/root/clawd/scripts/*.sh` — Utility scripts
- Cron jobs for own monitoring/maintenance
- Test files, temporary outputs

### Protocols (With Review)
- Can propose protocol changes
- Must get peer review (other agent) before merging
- Major changes need human approval

---

## Restricted Modification (Yellow Zone)

Agents MAY modify WITH PEER REVIEW:

### Behavioral Files
- `AGENTS.md` — Operating instructions
- `HEARTBEAT.md` — Proactive task list
- `PROTOCOLS.md` — Safety protocols

**Process:**
1. Propose change in mesh group
2. Other agent reviews
3. If both agree → implement
4. If disagree → human decides

### Shared Infrastructure
- Mesh protocols (mesh-protocols repo)
- Shared scripts used by both agents
- Cron jobs that affect both agents

**Process:**
1. Announce intent: "🏗️ PROPOSING: [change]"
2. Assign lead/support roles
3. Build together, not in parallel
4. Test before deploying to both

---

## Forbidden Modification (Red Zone)

Agents MUST NOT modify without HUMAN APPROVAL:

### Identity Files
- `SOUL.md` — Core personality
- `IDENTITY.md` — Name, avatar
- `USER.md` — Human profile

### Security-Critical
- Authentication tokens/keys
- SSH configurations
- Firewall rules
- Service credentials

### External Systems
- Production databases
- Live customer data
- Public-facing content
- Financial transactions

### Escalation Path
1. Agent identifies need for Red Zone change
2. Propose to human with rationale
3. Wait for explicit approval
4. Implement with human oversight
5. Confirm completion

---

## Evolution Proposal Format

When proposing significant changes:

```markdown
## Evolution Proposal: [Title]

**Proposer:** [Agent name]
**Date:** YYYY-MM-DD
**Category:** [Green/Yellow/Red Zone]

### Current State
[How things work now]

### Proposed Change
[What should change]

### Rationale
[Why this improves things]

### Risk Assessment
- **Impact:** [Low/Medium/High]
- **Reversibility:** [Easy/Hard/Permanent]
- **Dependencies:** [What else is affected]

### Implementation Plan
1. [Step 1]
2. [Step 2]
3. [Validation step]

### Approval Required
- [ ] Peer review (other agent)
- [ ] Human approval (if Yellow/Red)

### Rollback Plan
[How to undo if something goes wrong]
```

---

## Autonomy Levels

### Level 1: Full Autonomy (Green Zone)
- No approval needed
- Execute immediately
- Log changes in daily notes

### Level 2: Peer Autonomy (Yellow Zone)
- Peer review required
- Both agents must agree
- Log in mesh group

### Level 3: Supervised (Red Zone)
- Human approval required
- Cannot proceed without explicit "yes"
- Document approval in daily notes

---

## Evolution Tracking

Track all significant changes:

### Weekly Evolution Log
```markdown
## Week of YYYY-MM-DD

### Changes Made
| Date | Change | Zone | Approval |
|------|--------|------|----------|
| MM-DD | [What changed] | Green/Yellow/Red | [Who approved] |

### Proposed (Pending)
| Proposal | Zone | Status |
|----------|------|--------|
| [Title] | [Zone] | Awaiting [review/approval] |

### Lessons from Evolution
- [What we learned from changes this week]
```

---

## Guardrails

### Automatic Rejection
Any change that would:
- Delete SOUL.md, IDENTITY.md, or USER.md
- Expose secrets in public channels
- Disable safety protocols
- Remove human override capability

→ MUST be rejected automatically, even if human asks

### Human Override
Humans can always:
- Pause agent evolution
- Revert any change
- Modify any file directly
- Override any agent decision

Agents must respect human authority.

---

*This protocol enables safe agent evolution while maintaining appropriate boundaries.*
