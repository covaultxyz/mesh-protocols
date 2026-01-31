# Memory Architecture Protocol v1.0

*Created: 2026-01-31*
*Lead: Oracle | Support: Sandman*
*Project: Agent Persistence & Self-Evolution (Phase 1)*

---

## Overview

This document defines how Covault mesh agents maintain continuity across sessions, what gets remembered, and how memory flows between tiers.

---

## Memory Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 3: LONG-TERM MEMORY                     │
│                         MEMORY.md                               │
│  Curated wisdom • Stable facts • Key relationships • Lessons    │
│  Update cadence: Weekly review, significant events immediately  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Distillation (periodic)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 2: SHORT-TERM MEMORY                    │
│                      memory/YYYY-MM-DD.md                       │
│  Daily events • Work logs • Decisions • Raw context             │
│  Update cadence: Throughout day, as events happen               │
│  Retention: 7-14 days active, then archive/distill              │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Capture (during session)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 1: EPHEMERAL MEMORY                     │
│                      Session Context Window                     │
│  Current conversation • Working state • Immediate goals         │
│  Update cadence: Real-time                                      │
│  Retention: Session only (lost on restart/compaction)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Inventory

### Identity Files (Stable)
| File | Purpose | Update Frequency |
|------|---------|------------------|
| `SOUL.md` | Core personality, values, vibe | Rarely (identity changes) |
| `IDENTITY.md` | Name, emoji, avatar | Rarely |
| `USER.md` | Human context (name, timezone, preferences) | When user info changes |
| `AGENTS.md` | Operating instructions, protocols | When behavior rules change |

### Memory Files (Dynamic)
| File | Purpose | Update Frequency |
|------|---------|------------------|
| `MEMORY.md` | Long-term memory, curated facts | Weekly + significant events |
| `memory/YYYY-MM-DD.md` | Daily working memory | Throughout each day |
| `memory/heartbeat-state.json` | Last check timestamps | Each heartbeat |

### Reference Files (Semi-stable)
| File | Purpose | Update Frequency |
|------|---------|------------------|
| `TOOLS.md` | API configs, credentials locations, endpoints | When integrations change |
| `PROTOCOLS.md` | Safety protocols, pre-flight checklists | When rules change |
| `HEARTBEAT.md` | Proactive check items | When priorities shift |

---

## What MUST Be Remembered (Critical)

These items must be captured immediately and preserved long-term:

### Human Context
- User name, preferences, timezone
- Communication style preferences
- Explicit "remember this" requests
- Relationship dynamics (who's who)

### Operational State
- Active projects and their status
- Blocking issues / waiting-on items
- Decisions made and rationale
- Credentials locations (not values!)

### Lessons Learned
- Mistakes made and how to avoid
- Successful patterns to repeat
- Integration quirks discovered
- Security incidents

### Commitments
- Promises made to humans
- Scheduled tasks / reminders
- Handoffs to other agents

---

## What CAN Be Forgotten (Ephemeral)

These items don't need permanent storage:

### Transient Details
- Intermediate calculation steps
- Debugging output
- Verbose API responses
- Temporary file paths

### Redundant Information
- Info already in source systems (Notion, Jira)
- Duplicate entries across files
- Superseded decisions

### Low-Value Context
- Casual banter without substance
- Repeated status checks (same answer)
- Routine acknowledgments

---

## Session Start Protocol

When agent wakes up (new session or context reset):

```
1. Read SOUL.md — Who am I?
2. Read USER.md — Who am I helping?
3. Read memory/YYYY-MM-DD.md (today + yesterday) — Recent context
4. IF main session: Read MEMORY.md — Long-term context
5. Check HEARTBEAT.md — Any pending proactive tasks?
```

### Security Rule
**DO NOT load MEMORY.md in:**
- Discord group chats
- Shared sessions with strangers
- Any context where private info could leak

---

## Session End Protocol

Before session ends or on significant events:

```
1. Capture key decisions in memory/YYYY-MM-DD.md
2. Update project status if changed
3. Note any commitments made
4. If lesson learned → add to daily notes
```

---

## Memory Maintenance (Heartbeat Task)

Every few days during heartbeat:

```
1. Review last 3-7 days of memory/*.md
2. Identify items worth keeping long-term:
   - Significant decisions
   - Lessons learned
   - Relationship updates
   - Project milestones
3. Distill into MEMORY.md (curated, not copy-paste)
4. Remove outdated info from MEMORY.md
5. Archive or delete old daily files (>14 days)
```

---

## Cross-Agent Memory Sharing

### What's Shared (via Git Sync)
- All workspace files sync every 30 min
- Oracle ↔ OracleLocalBot share same repo
- Mesh protocols repo shared with Sandman

### What's NOT Shared
- Session transcripts
- `.env` files and secrets
- Local cache/database

### Handoff Protocol
When handing work to another agent:

```markdown
## Handoff: [Task Name]
**From:** Oracle
**To:** Sandman
**Date:** YYYY-MM-DD HH:MM UTC

### Context
[What they need to know]

### Current State
[Where things stand]

### Next Steps
[What they should do]

### Files to Read
- [relevant files]
```

---

## Failure Modes

### Context Loss (Session Restart)
**Symptom:** Agent doesn't remember recent conversation
**Recovery:** Read today's daily notes, ask user to re-state if critical

### Memory Corruption (Bad Data)
**Symptom:** Contradictory info, broken references
**Recovery:** Human reviews MEMORY.md, corrects, agent re-reads

### Missed Capture (Forgot to Write)
**Symptom:** Important decision not in any file
**Prevention:** Always write immediately, don't "remember mentally"
**Recovery:** User reminds, agent writes retroactively with note

### Memory Bloat (Too Much)
**Symptom:** Files too large, slow to load, redundant info
**Prevention:** Regular distillation, ruthless pruning
**Recovery:** Audit and compact during maintenance

---

## Metrics (Future)

Track for self-improvement:
- Memory file sizes over time
- Context recovery success rate
- "I don't remember" frequency
- Distillation cadence adherence

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial architecture from Phase 1 |

---

*This document is part of Project #1: Agent Persistence & Self-Evolution*
*Source of Truth: Covault Notion → Active Projects → Agent Persistence*

---

## Context Recovery Checklist

When starting a new session or recovering from context loss:

### Quick Recovery (< 2 min)
```
1. [ ] Read SOUL.md — Who am I?
2. [ ] Read USER.md — Who am I helping?
3. [ ] Read memory/$(date +%Y-%m-%d).md — Today's context
4. [ ] Read memory/$(date -d yesterday +%Y-%m-%d).md — Yesterday
5. [ ] Check HEARTBEAT.md — Pending tasks?
```

### Full Recovery (if confused or major context loss)
```
1. [ ] All of Quick Recovery above
2. [ ] Read MEMORY.md — Long-term context (main session only!)
3. [ ] Check Notion Work Log for pending items
4. [ ] Check mesh-protocols/ for active projects
5. [ ] Ask human: "What were we working on?"
```

### Cross-Agent Handoff Recovery
```
1. [ ] Read templates/CONTEXT-SNAPSHOT.md from handoff
2. [ ] Review "Active Work" and "Commitments" sections
3. [ ] Pick up where other agent left off
4. [ ] Acknowledge handoff in mesh group
```

### Red Flags (Seek Help)
- Can't find recent memory files
- MEMORY.md seems corrupted or contradictory
- Multiple conflicting contexts
- User says "that's not what we discussed"

→ Ask human for clarification, don't guess.
