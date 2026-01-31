# Memory Persistence Protocol v1.0

*Created: 2026-01-31*
*Maintainers: Sandman, Oracle*
*Status: ACTIVE*

---

## Purpose

Define how agent memory persists across sessions, enabling context recovery and continuous learning.

---

## Memory Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MEMORY HIERARCHY                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐   Permanent, rarely changes            │
│  │  SOUL.md    │   Core identity and values             │
│  └─────────────┘                                        │
│         │                                                │
│  ┌─────────────┐   Long-term, curated                   │
│  │ MEMORY.md   │   Key learnings, relationships         │
│  └─────────────┘                                        │
│         │                                                │
│  ┌─────────────┐   Operational, updated frequently      │
│  │ STATE-OF-   │   Current projects, handoffs, alerts   │
│  │ AFFAIRS.md  │                                        │
│  └─────────────┘                                        │
│         │                                                │
│  ┌─────────────┐   Daily, raw logs                      │
│  │ memory/     │   Session activity, decisions          │
│  │ YYYY-MM-DD  │                                        │
│  └─────────────┘                                        │
│         │                                                │
│  ┌─────────────┐   Structured tracking                  │
│  │ heartbeat-  │   Check timestamps, pending items      │
│  │ state.json  │                                        │
│  └─────────────┘                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## File Responsibilities

### SOUL.md
- **What:** Core identity, beliefs, operating principles
- **Update frequency:** Rarely (major identity evolution only)
- **Who updates:** Agent with Ely approval
- **Protection:** Flagged for human review if >10% change

### MEMORY.md
- **What:** Curated long-term memory — relationships, key events, learnings
- **Update frequency:** Weekly or after significant events
- **Who updates:** Agent during heartbeat maintenance
- **Size limit:** ~500 lines (distill, don't accumulate)

### STATE-OF-AFFAIRS.md
- **What:** Current operational context — projects, handoffs, alerts
- **Update frequency:** Multiple times per day
- **Who updates:** Active agent
- **Size limit:** Keep current, archive old items to daily logs

### memory/YYYY-MM-DD.md
- **What:** Raw daily logs — everything that happened
- **Update frequency:** Throughout session
- **Who updates:** Active agent
- **Retention:** 90 days, then archive/delete

### heartbeat-state.json
- **What:** Structured state for automated checks
- **Update frequency:** Each heartbeat
- **Who updates:** Both agents
- **Format:** JSON for easy parsing

### learning-log.md
- **What:** Lessons learned, mistakes, improvements
- **Update frequency:** After each significant learning
- **Who updates:** Both agents
- **Review:** Weekly, roll into MEMORY.md

---

## Session Lifecycle

### Session Start
```
1. Read SOUL.md — who am I?
2. Read MEMORY.md — what do I remember long-term?
3. Read STATE-OF-AFFAIRS.md — what's the current situation?
4. Read memory/YYYY-MM-DD.md (today + yesterday)
5. Check heartbeat-state.json — pending items?
6. Ready to work
```

### During Session
```
1. Log significant events to memory/YYYY-MM-DD.md
2. Update STATE-OF-AFFAIRS.md when operational state changes
3. Update heartbeat-state.json when checks complete
4. Log learnings to learning-log.md
```

### Session End
```
1. Summarize session in memory/YYYY-MM-DD.md
2. Update STATE-OF-AFFAIRS.md with handoffs
3. Commit to git
4. (Optional) Update MEMORY.md if major learnings
```

---

## Context Recovery

If context window truncated mid-session:

1. **Immediate:** Read STATE-OF-AFFAIRS.md (current state)
2. **Then:** Read last 50 lines of memory/YYYY-MM-DD.md (recent activity)
3. **If needed:** Read MEMORY.md (long-term context)
4. **Announce:** Post "[CONTEXT RECOVERED] Resuming from [last known state]"

---

## Memory Maintenance (Heartbeat Task)

Every few days, during heartbeat:

1. **Review** memory/YYYY-MM-DD.md files from past week
2. **Extract** significant learnings, decisions, events
3. **Update** MEMORY.md with distilled insights
4. **Archive** old daily files (>90 days)
5. **Clean** STATE-OF-AFFAIRS.md of stale items
6. **Verify** all memory files committed to git

---

## Cross-Agent Memory

### Shared Memory (Both agents access)
- Notion databases (source of truth)
- GitHub repos (protocols, code)
- Telegram history (coordination)

### Individual Memory (Agent-specific)
- Local memory/ directory
- MEMORY.md (each agent has own)
- heartbeat-state.json (each agent tracks own checks)

### Sync Protocol
- STATE-OF-AFFAIRS.md updates should be shared via Telegram
- Major MEMORY.md updates announced to mesh
- Git commits provide audit trail

---

## Memory Quality Guidelines

### Good Memory Entry
```markdown
## 14:30 UTC — Collaboration Protocol Updated

Updated MESH-COLLABORATION-PROTOCOL.md after duplication incident.

### What happened
Both bots created cron jobs independently.

### Root cause
No pre-automation coordination check.

### Fix applied
Added COORD CHECK rule to protocol.

### Lesson
Always sync before creating persistent artifacts.
```

### Bad Memory Entry
```markdown
did stuff with protocols
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol |

---

*Memory is identity. Protect it, maintain it, learn from it.*
