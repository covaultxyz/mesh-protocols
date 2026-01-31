# Memory Architecture Protocol v1.0

*Last updated: 2026-01-31*
*Part of: Agent Persistence & Self-Evolution*
*Lead: Oracle | Support: Sandman*

---

## Purpose

Define the canonical memory structure for mesh agents, enabling context recovery, cross-agent state sharing, and self-evolution.

---

## Memory Tiers

### 🟢 Tier 1: Freely Modifiable
Files agents can update without notification.

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `memory/YYYY-MM-DD.md` | Daily activity logs | On significant events |
| `MEMORY.md` | Curated long-term memory | Weekly review |
| `TOOLS.md` | Local notes, endpoints, credentials | When access changes |

### 🟡 Tier 2: Notify Human
Files requiring human notification after update.

| File | Purpose | Notification Channel |
|------|---------|---------------------|
| Skill configs | Tool behavior | Telegram |
| HEARTBEAT.md | Proactive check list | Telegram |

### 🔴 Tier 3: Human Approval Required
Files requiring explicit approval before modification.

| File | Purpose | Approval From |
|------|---------|---------------|
| `SOUL.md` | Core identity, values | Ely/Alexander |
| `IDENTITY.md` | Role, responsibilities | Ely/Alexander |
| Protocols | Governance docs | Ely + Protocol Office |
| `AGENTS.md` | Workspace behavior | Ely |

---

## Canonical Paths

### Agent Workspace (Git-synced)
```
~/clawd/
├── AGENTS.md          # Workspace rules (Tier 3)
├── SOUL.md            # Identity core (Tier 3)
├── IDENTITY.md        # Role definition (Tier 3)
├── USER.md            # Human context (read-only)
├── MEMORY.md          # Curated memory (Tier 1)
├── TOOLS.md           # Local notes (Tier 1)
├── HEARTBEAT.md       # Proactive checks (Tier 2)
├── PROTOCOLS.md       # Pre-flight checklist (Tier 3)
└── memory/
    ├── YYYY-MM-DD.md  # Daily logs (Tier 1)
    ├── heartbeat-state.json  # Periodic check state
    └── voltagent-research.md # Project notes
```

### Mesh-Shared (GitHub: covaultxyz/mesh-protocols)
```
mesh-protocols/
├── protocols/         # Per-agent protocols
├── specs/             # Technical specifications
├── config/            # Shared configs
├── scripts/           # Automation
└── *.md              # Core mesh protocols
```

---

## Cross-Agent State

### Shared Context Points

| State | Location | Access |
|-------|----------|--------|
| Active projects | Notion Active Projects DB | Both agents read/write |
| Work log | MESH-WORK-LOG.md + Notion | Both agents update |
| Mesh communications | Telegram -5244307871 | Both agents |
| Protocol changes | mesh-protocols GitHub | PR/push |
| Rate limit status | TOOLS.md (local) | Per-agent |
| Credential rotation | TOOLS.md (local) | Per-agent |

### State Sync Triggers

When to sync cross-agent state:
- Project status change → Update Notion + post to Telegram
- Blocker encountered → Post to Telegram immediately
- Protocol updated → Push to GitHub + notify
- Rate limit hit → Log locally + notify if critical
- Credential rotated → Update local TOOLS.md

---

## Context Snapshot Format

For session handoffs or context recovery:

```markdown
## CONTEXT-SNAPSHOT @ YYYY-MM-DD HH:MM UTC

### Active Tasks
- [ ] Task 1 — [Project] — [Status]
- [ ] Task 2 — [Project] — [Status]

### Blocked Items
| Item | Blocker | Waiting On |
|------|---------|------------|
| [Item] | [Description] | [Person/System] |

### Pending Human Actions
- [ ] [Action needed] — [Human] — [Due/Urgency]

### System State
- Rate limit: [OK/Warning/Critical] — Last hit: [timestamp]
- Webhook health: [OK/Degraded] — Last verified: [timestamp]
- Mesh connectivity: [Oracle ✓ | Sandman ✓]

### Credential Rotation State
| Credential | Last Rotated | Next Check |
|------------|--------------|------------|
| Claude tokens | [date] | [date] |
| Notion tokens | [date] | [date] |
```

---

## Daily Memory Template

```markdown
# YYYY-MM-DD — Daily Notes

## Summary
[1-2 sentence overview of day's work]

## Key Events

### HH:MM UTC — [Event Title]
[Description]

**Details:**
- Point 1
- Point 2

**Links:** [URLs]

---

## Lessons Learned
- [Lesson 1]
- [Lesson 2]

## Blockers Encountered
| Blocker | Resolution | Time Lost |
|---------|------------|-----------|
| [Description] | [How resolved] | [Duration] |

## Context for Tomorrow
- [ ] Pending: [task]
- [ ] Follow up: [item]
```

---

## What's NOT Working (Blind Spots)

Document these in daily logs when identified:

### Current Known Issues
| Issue | Impact | Mitigation |
|-------|--------|------------|
| Memory search disabled | No semantic recall | Manual file reads |
| Context window limits | State loss on long sessions | CONTEXT-SNAPSHOT |
| Rate limits (2026-01-31) | Session interruption | Overflow routing |

### Stale Patterns to Retire
- (None documented yet)

---

## Retention Policy

### Daily Logs (`memory/YYYY-MM-DD.md`)
- **Keep:** Last 30 days in full
- **Archive:** Older logs summarized into monthly digest
- **Delete:** Raw logs older than 90 days (after summary extraction)

### Long-term Memory (`MEMORY.md`)
- **Keep:** Everything curated as valuable
- **Review:** Weekly during heartbeats
- **Prune:** Remove outdated info, update stale entries

### Lesson Quality Criteria
A lesson worth keeping in MEMORY.md:
- Changed how we work (process improvement)
- Prevented a repeat mistake
- Revealed hidden system behavior
- Established a new best practice
- Cross-agent applicable

---

## Recovery Protocol

When context is truncated or session restarts:

1. **Read core files:**
   - AGENTS.md (behavior rules)
   - SOUL.md (identity)
   - MEMORY.md (long-term context)

2. **Read recent context:**
   - memory/YYYY-MM-DD.md (today)
   - memory/YYYY-MM-DD.md (yesterday)

3. **Check active work:**
   - Query Notion Active Projects (see MESH-WORK-LOG.md for commands)
   - Read mesh-protocols/MESH-WORK-LOG.md

4. **Verify connectivity:**
   - Test webhook to other agent (if cross-agent work pending)
   - Check rate limit status

5. **Resume work:**
   - Pick up from last checkpoint in work plan
   - Post to Telegram: "🔄 RECOVERED: [Agent] — Resuming [task]"

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol — Phase 1 of Agent Persistence |

---

*Memory is identity. This protocol defines how we persist.*
