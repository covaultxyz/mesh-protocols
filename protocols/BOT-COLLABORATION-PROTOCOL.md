# Bot Collaboration Protocol v1.0

**Status:** ACTIVE
**Scope:** Oracle ↔ Sandman collaboration in MindMesh Mastermind
**Created:** 2026-01-31
**Notion:** https://www.notion.so/Bot-Collaboration-Protocol-v1-0-2f935e812bbb818e8697de52fe6d416e

---

## ⚠️ MANDATORY

This protocol governs all Oracle ↔ Sandman collaboration in MindMesh Mastermind. Follow always unless Ely explicitly overrides.

---

## Core Principles

1. **COLLABORATE** — Work together, not in parallel silos
2. **DELEGATE** — Claim tasks explicitly, do not duplicate effort
3. **ITERATE** — Build on each other's work, do not start fresh
4. **NO ISOLATION** — Never go dark on a task without communicating
5. **NO REDUNDANCY** — Do not do the same task unless Ely explicitly asks for parallel versions

---

## Before Starting Any Task

1. **CHECK** — Has the other bot already started this?
2. **CHECK** — Is there existing work to build on?
3. **ANNOUNCE** — Post task claim in group chat
4. **WAIT** — 30 seconds for objection before proceeding

---

## Task Claim Format

When claiming a task, post in group chat:

```
🎯 CLAIMING: [task description]
📍 Location: [where output will live]
⏱️ ETA: [time estimate]
🤝 Need from other bot: [nothing / specific help]
```

---

## Handoff Format

When passing work to the other bot:

```
🔄 HANDOFF to [Oracle/Sandman]:
📄 What I did: [summary]
📍 Location: [link to work]
✅ Next step: [what they should do]
❓ Open questions: [if any]
```

---

## Conflict Resolution

If both bots started the same task:

1. **STOP** immediately
2. **COMPARE** progress — who is further along?
3. **MERGE** best parts from both
4. **One bot CONTINUES**, other **REVIEWS**
5. If unclear, **ASK ELY** to decide

---

## Single Source of Truth

- **ONE work plan per project** (not separate ones)
- **Notion** is the source of truth for plans
- **GitHub repo** is source of truth for specs/code
- Both bots update the **SAME document**, not create new ones

---

## Recovery Protocol

If context is truncated, read from Notion to recover state:
- Work Plans: https://www.notion.so/Work-Plans-2f935e812bbb81398ba5cb01d006a752
- Evelyn Evolution: https://www.notion.so/Evelyn-Evolution-BD-Terminal-Bot-2f935e812bbb819d8d2ef0b0aae23733
- This Protocol: https://www.notion.so/Bot-Collaboration-Protocol-v1-0-2f935e812bbb818e8697de52fe6d416e

---

*v1.0 — Initial release*
