# Memory Retention Protocol v1.0

*Created: 2026-02-01*
*Owner: Sandman*
*Status: ACTIVE*

📍 **Canonical Location:** `protocols/MEMORY-RETENTION-PROTOCOL.md`

---

## Purpose

Define what memory to keep, archive, and delete. Prevent bloat while preserving institutional knowledge.

---

## Retention Tiers

### Tier 1: Permanent (Never Delete)
- `MEMORY.md` — Curated long-term memory
- `IDENTITY.md`, `SOUL.md` — Core identity
- `AGENTS.md`, `TOOLS.md` — Operational config
- Protocols in `protocols/` — Institutional rules
- Decision nodes in Neo4j — Audit trail

### Tier 2: Active (Keep 90 Days)
- Daily logs: `memory/YYYY-MM-DD.md`
- Session logs
- Error nodes in Neo4j
- Task completion records

### Tier 3: Archive (90-365 Days)
- Compress and move to `memory/archive/`
- Keep summary, drop raw logs
- Retain if referenced by active decisions

### Tier 4: Purge (>365 Days)
- Delete unless flagged for permanent retention
- Keep only distilled learnings in MEMORY.md

---

## Daily Log Lifecycle

```
Day 0:    Create memory/YYYY-MM-DD.md
Day 1-7:  Active reference (read during session start)
Day 8-30: Background reference (searchable)
Day 31-90: Archive candidate
Day 90+:  Distill → MEMORY.md, then archive
Day 365+: Purge (unless flagged)
```

---

## What to Distill to MEMORY.md

Extract from daily logs:
- **Decisions made** — Why we chose X over Y
- **Lessons learned** — What worked, what didn't
- **Key relationships** — New contacts, collaborations
- **Architecture changes** — System updates
- **Protocols created** — New rules

Do NOT copy:
- Routine task completions
- Debug logs
- Conversation transcripts
- Temporary state

---

## Automated Maintenance

### Daily (via heartbeat)
```bash
# Check for logs >90 days old
find memory/ -name "*.md" -mtime +90 -type f
```

### Weekly
- Review MEMORY.md for stale entries
- Distill recent daily logs to MEMORY.md
- Archive logs 90-365 days old

### Monthly
- Audit Neo4j for orphaned nodes
- Purge archived logs >365 days
- Review retention policy for updates

---

## Archive Format

When archiving a daily log:
1. Extract key facts to `memory/archive/YYYY-MM-summary.md`
2. Compress original: `gzip memory/YYYY-MM-DD.md`
3. Move to `memory/archive/`

Summary format:
```markdown
# 2026-01 Summary

## Key Decisions
- [date] Decision X: rationale

## Lessons Learned  
- [date] Lesson Y

## Notable Events
- [date] Event Z
```

---

## Size Limits

| File | Max Size | Action if Exceeded |
|------|----------|-------------------|
| MEMORY.md | 500 lines | Prune oldest/least relevant |
| Daily log | 50KB | Split or summarize |
| memory/ total | 10MB | Trigger archive cycle |

---

## Flagging for Retention

To prevent auto-purge, add to file header:
```markdown
<!-- RETAIN: reason for permanent retention -->
```

Or tag in Neo4j:
```cypher
SET d.retain = true, d.retain_reason = "Critical decision"
```

---

*Memory is finite. Wisdom is distilled.*

---

## Implementation Checklist

### Daily
- [ ] Run `memory-health.sh` to check status
- [ ] Distill key learnings to MEMORY.md if significant

### Weekly
- [ ] Review logs 7-30 days old
- [ ] Archive logs >90 days (`memory-maintenance.sh --archive`)
- [ ] Prune MEMORY.md of stale entries

### Monthly
- [ ] Run full `memory-maintenance.sh`
- [ ] Review retention policy for updates
- [ ] Check Neo4j for orphaned nodes
