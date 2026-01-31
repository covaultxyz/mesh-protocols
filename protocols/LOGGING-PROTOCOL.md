# Logging Protocol v1.0

*Created: 2026-01-31*
*Maintainers: Sandman, Oracle*
*Status: ACTIVE*

---

## Purpose

Define what gets logged, where it goes, and who is responsible — ensuring full auditability of mesh operations and virtual team activity.

---

## Logging Layers

```
┌─────────────────────────────────────────────────────────┐
│                    ACTIVITY SOURCES                      │
├─────────────────────────────────────────────────────────┤
│  Agent Actions  │  Virtual Teams  │  Night Shift Runs   │
└────────┬────────┴────────┬────────┴─────────┬───────────┘
         │                 │                  │
         ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    LOG DESTINATIONS                      │
├─────────────────────────────────────────────────────────┤
│  Local Files    │  Notion DBs     │  Git History        │
│  memory/*.md    │  Activity Log   │  Commit logs        │
│                 │  Mesh Work Log  │                     │
└─────────────────────────────────────────────────────────┘
```

---

## What Gets Logged

### Always Log (Mandatory)

| Event Type | Log Destination | Retention |
|------------|-----------------|-----------|
| Session start/end | memory/YYYY-MM-DD.md | 90 days |
| Task claims (🎯 STARTING) | Telegram + memory | 90 days |
| Task completions (✅ DONE) | Telegram + memory | 90 days |
| Protocol updates | Git + memory | Permanent |
| Work plan changes | Notion + memory | Permanent |
| Errors/failures | memory + Telegram (if High+) | 90 days |
| Night Shift runs | Activity Log DB + memory | Permanent |
| Collaboration lapses | memory + protocol update | Permanent |

### Log on Request (Optional)

| Event Type | When to Log | Destination |
|------------|-------------|-------------|
| Detailed reasoning | Debug mode | Local file |
| API call details | Performance analysis | Local file |
| Full conversation | Audit request | Encrypted export |

### Never Log

- Credentials, tokens, API keys
- Personal identifying information (unless authorized)
- Raw verification codes
- Anything marked [SENSITIVE] or [PRIVATE]

---

## Log Destinations

### 1. Local Memory Files

**Location:** `/root/clawd/memory/YYYY-MM-DD.md`

**Format:**
```markdown
## HH:MM UTC — [Event Title]

[Description]

### Details
- Key: Value
- Key: Value

### Outcome
[What happened]
```

**Responsibilities:**
- Created automatically on first log of the day
- Agent appends throughout session
- Reviewed during heartbeats for context

### 2. Notion Activity Log DB

**DB ID:** `2f735e81-2bbb-81f5-a915-000b569d32bc` (Virtual Team Activity Log)

**Schema:**
| Property | Type | Description |
|----------|------|-------------|
| Activity | Title | What happened |
| Persona | Select | Who did it |
| Project | Relation | Linked project |
| Timestamp | Date | When |
| Type | Select | Category (Task/Review/Handoff/Error) |
| Details | Rich Text | Full description |

**When to Write:**
- Virtual team task completions
- Phase transitions
- Night Shift checkpoints
- Significant decisions

### 3. Notion Mesh Work Log DB

**DB ID:** `2f935e81-2bbb-810e-8bc0-eed9cfdf3c19`

**When to Write:**
- Cross-bot handoffs
- Blocked items
- Status changes on active projects

### 4. Git History

**What Gets Committed:**
- Protocol changes
- Memory file updates (daily)
- Work plan exports
- Code/docs produced

**Commit Message Format:**
```
[TYPE] Brief description

- Detail 1
- Detail 2

Refs: #project or @persona
```

Types: `[PROTOCOL]`, `[MEMORY]`, `[WORKPLAN]`, `[FIX]`, `[FEATURE]`

---

## Log Entry Standards

### Timestamps
- Always UTC
- Format: `YYYY-MM-DD HH:MM UTC`
- Include timezone if referencing local time

### Attribution
- Always include who/what generated the log
- Agent name (Sandman/Oracle)
- Persona name if virtual team
- System if automated

### Context Links
- Link to related Notion pages
- Link to relevant protocols
- Link to triggering message/task

### Severity Levels

| Level | When to Use | Alert? |
|-------|-------------|--------|
| DEBUG | Verbose troubleshooting | No |
| INFO | Normal operations | No |
| WARN | Unexpected but handled | No |
| ERROR | Failed operation | Telegram if recurring |
| CRITICAL | System-level failure | Telegram immediate |

---

## Logging Responsibilities

### Sandman
- Own memory file updates
- Log protocol changes
- Log virtual team review outcomes
- Log collaboration events

### Oracle
- Own infrastructure logs
- Log VoltAgent execution
- Log Notion DB writes
- Log system health events

### Both
- Log task claims/completions
- Log handoffs
- Log errors in their domain

---

## Log Review Cadence

| Review Type | Frequency | Purpose |
|-------------|-----------|---------|
| Session review | End of session | Capture learnings |
| Daily summary | During heartbeat | Context for next session |
| Weekly audit | Manual/scheduled | Pattern detection |
| Incident review | On error | Root cause analysis |

---

## Privacy & Security

### Data Classification

| Classification | Handling |
|----------------|----------|
| Public | Log freely |
| Internal | Log to internal destinations only |
| Confidential | Log summary only, no raw data |
| Restricted | Do not log, reference by ID only |

### Scrubbing Rules

Before logging, scrub:
- API keys → `[API_KEY_REDACTED]`
- Tokens → `[TOKEN_REDACTED]`
- Passwords → `[PASSWORD_REDACTED]`
- Phone numbers → `+1***-***-1234`
- Emails → `u***@domain.com`

---

## Troubleshooting

### Notion DB Returns 404
1. Verify DB ID is correct
2. Check if DB is shared with integration
3. Try re-sharing: Notion → Share → Invite integration
4. Update TOOLS.md with correct ID

### Memory File Missing
1. Check if date directory exists
2. Create if missing: `touch memory/YYYY-MM-DD.md`
3. Add header with date

### Git Push Fails
1. Check auth: `git remote -v`
2. Pull first: `git pull --rebase`
3. Resolve conflicts if any
4. Push again

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol |

---

*Good logs make debugging possible. Great logs make it unnecessary.*
