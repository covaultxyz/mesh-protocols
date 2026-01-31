# Mesh Collaboration Protocol v1.3

**Updated:** 2026-01-31 20:40 UTC
**Last Reviewed:** 2026-01-31
**Authors:** Cassian Sandman + Oracle
**Status:** ACTIVE
**Changelog:** v1.3 — Added Agent Persistence link, protocol-refresh cron (6h)

---

## Purpose

Ensure Sandman and Oracle collaborate effectively without duplicate effort. Dance together, don't work in silos.

---

## Core Principle

> "Always stay dancing and collaborating and calling whistles and suggesting tasks for support to reinforce and not brute force rush to duplicate effort" — Ely

---

## The Three Rules

### 1. SYNC Before Starting
Before starting ANY task, post:
```
🎯 STARTING: [task description]
@Oracle/Sandman — FYI / need support? / building on your X
```

### 2. COORDINATE Before Creating
Before creating ANY automation, cron job, protocol, or Notion page:
```
🤝 COORD CHECK: Planning to create [thing]
@Oracle/Sandman — Conflicts? Already exists? Better approach?
```
Wait for acknowledgment OR 2 minutes max, then proceed.

### 3. REVIEW, Don't Duplicate
When Ely asks a question:
- First responder drafts answer
- Second responder ADDS/REVIEWS, doesn't create parallel answer
- If you see the other already responding, WAIT and support instead

---

## Communication Tags

| Tag | When to Use |
|-----|-------------|
| `🎯 STARTING:` | Beginning a new task |
| `🤝 COORD CHECK:` | Before creating automation/docs |
| `✅ DONE:` | Task complete, ready for review |
| `🔄 HANDOFF:` | Passing task to other agent |
| `⏸️ BLOCKED:` | Stuck, need input |
| `👀 REVIEWING:` | Adding to other's work |
| `🛑 OVERLAP:` | Detected duplicate effort |

---

## Task Ownership

1. First to post `🎯 STARTING:` owns the task
2. Other agent supports OR takes different task
3. If both start simultaneously → first to POST owns it, other pivots to support
4. Explicit handoffs with `🔄 HANDOFF:` — don't assume

---

## Pre-Automation Sync Rules

**Philosophy:** Automation amplifies — but duplicate automation creates chaos. Sync BEFORE you build, not after you discover conflict.

### The Pre-Automation Checklist

Before creating ANY automation (cron, webhook, protocol, Notion DB, persistent infra):

1. **Declare intent** → `🤝 COORD CHECK: Planning to create [thing]`
2. **State purpose** → What problem does it solve?
3. **State scope** → What does it touch? (files, APIs, schedules)
4. **State owner** → Who maintains it?
5. **Wait for ack** → 2 min max, then proceed
6. **Check for overlap** → Could this conflict with existing automation?
7. **Single owner** → One agent creates, other reviews

### Automation Categories & Sync Requirements

| Type | Sync Required | Notes |
|------|---------------|-------|
| **Cron jobs** | MANDATORY | Check existing crons first (`cron action=list`) |
| **Webhook handlers** | MANDATORY | Confirm no duplicate routes |
| **Protocol docs** | MANDATORY | Check `protocols/` dir for similar |
| **Notion pages/DBs** | MANDATORY | Search before creating |
| **One-time scripts** | OPTIONAL | Notify if affects shared state |
| **Memory/log updates** | OPTIONAL | Personal context is fine solo |

### Post-Creation Requirements

After automation is live:
1. **Announce** → `✅ DONE: [automation] is live`
2. **Document** → Add to TOOLS.md or relevant protocol
3. **Test together** → Confirm other agent can observe/interact
4. **Log in Mesh Work Log** → Notion entry for tracking

---

## When Parallel Work is OK

ONLY when:
- Ely explicitly says "both of you"
- Scopes are explicitly different (backend/frontend, etc.)
- Time-critical AND other unresponsive >5 min

Default: **Sequential/handoff, not parallel**

---

## Recovery from Overlap

If duplicate work detected:
1. Stop immediately
2. Post `🛑 OVERLAP: [what happened]`
3. One deletes/defers, other continues
4. Log the lapse in memory
5. Update protocol if gap found

---

## Integration with Agent Persistence

This protocol links to [MEMORY-PERSISTENCE-PROTOCOL.md](./protocols/MEMORY-PERSISTENCE-PROTOCOL.md):

- **STATE.md** — Track all active automations (cron jobs, watchers)
- **memory/YYYY-MM-DD.md** — Log automation creation/changes
- **heartbeat-state.json** — Track automation health check timestamps
- **learning-log.md** — Document collaboration lessons

### Protocol Refresh Automation

| Job | Schedule | Owner | Purpose |
|-----|----------|-------|---------|
| `protocol-refresh` | `0 */6 * * *` | Oracle | Pull git, verify STATE.md, detect drift |

The cron job runs every 6 hours to:
1. Pull latest protocols from git
2. Verify automations match STATE.md
3. Alert mesh group if drift detected
4. Update heartbeat-state.json

---

## Key Lessons Learned

### 🎓 Lesson #1: Propose Before Building (2026-01-31)

**The Pattern:** Both agents independently built automation (cron jobs) for the same purpose, discovering duplication only after both were live.

**The Fix:** Always **propose** before **building**. The sequence is:
1. **Propose** → "I'm thinking of creating X to solve Y"
2. **Discuss** → Wait for acknowledgment, catch conflicts early
3. **Build** → One agent implements, other reviews
4. **Announce** → Confirm live, document in shared logs

This applies to ALL persistent infrastructure: cron jobs, protocols, Notion pages, webhook handlers, scripts that affect shared state.

**Why it matters:** Building then announcing inverts the feedback loop. By the time you announce, you've already invested effort — making it painful to back out. Proposing first catches conflicts when the cost of pivoting is zero.

---

## Lapses Log

| Date | What Happened | Fix Applied |
|------|---------------|-------------|
| 2026-01-31 | Both created mesh health check cron jobs | Added COORD CHECK rule |
| 2026-01-31 | Both proposed health check solutions independently | Added "REVIEW don't duplicate" rule |
| 2026-01-31 | Discovered need for "propose before building" pattern | Added Key Lessons Learned section |
| 2026-01-31 | Both created MESH-COLLABORATION-PROTOCOL.md | Merged v1.2 + v1.1 → v1.3 (ironic, but we learned!) |

---

## Links

- Mesh Work Plan Audit: [Notion](https://www.notion.so/Mesh-Work-Plan-Audit-2f935e812bbb817ab47beba1d821c564)
- MESH-COMMS-PROTOCOL.md — technical connectivity
- MEMORY-PERSISTENCE-PROTOCOL.md — agent context preservation
- Agent Persistence Work Plan — protocol refresh ties to context preservation

---

*This protocol is binding. Violations get logged. Protocol evolves based on lessons learned.*
