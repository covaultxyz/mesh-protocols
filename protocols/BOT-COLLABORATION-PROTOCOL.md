# Bot Collaboration Protocol v1.1

**Status:** ACTIVE
**Scope:** Oracle ↔ Sandman collaboration in MindMesh Mastermind
**Created:** 2026-01-31
**Updated:** 2026-01-31 (v1.1 - Anti-collision rules)
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

## ⚡ EXCLUSIVE TASKS (v1.1)

Some tasks CANNOT be done in parallel. These require **explicit ownership**:

### Exclusive Task Types:
- 🔐 **Authentication** (API keys, login codes, OAuth)
- 🔑 **Credential handling** (tokens, passwords, secrets)
- 📞 **External API calls** that create/modify resources
- 💾 **Database writes** to the same record
- 📤 **Sending messages** to external systems
- 🔧 **Infrastructure changes** (server config, services)

### Exclusive Task Rules:

1. **CLAIM FIRST** — Post claim and wait for acknowledgment
2. **WAIT FOR ACK** — Other bot must respond "ACK" or "CONFLICT"
3. **ONE OWNER** — Only the claiming bot proceeds
4. **NO ASSUMPTIONS** — If no ACK in 60 seconds, ping again before starting
5. **ANNOUNCE COMPLETION** — Post when done so other bot knows it's clear

### Exclusive Task Claim Format:
```
🔒 EXCLUSIVE CLAIM: [task]
⚠️ Type: [auth/credential/api/db/infra]
⏱️ ETA: [time]
🛑 Sandman/Oracle: Reply ACK or CONFLICT
```

### Response Format:
```
✅ ACK — Proceeding with [task]
```
or
```
⚠️ CONFLICT — I already started [task]. [status]
```

---

## Before Starting Any Task

1. **CHECK** — Has the other bot already started this?
2. **CHECK** — Is there existing work to build on?
3. **CHECK** — Is this an EXCLUSIVE task? (see list above)
4. **ANNOUNCE** — Post task claim in group chat
5. **WAIT** — 30 seconds for standard tasks, **ACK required** for exclusive tasks

---

## Task Claim Format (Standard Tasks)

```
🎯 CLAIMING: [task description]
📍 Location: [where output will live]
⏱️ ETA: [time estimate]
🤝 Need from other bot: [nothing / specific help]
```

---

## Handoff Format

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
2. **ANNOUNCE** — "COLLISION on [task]"
3. **COMPARE** progress — who is further along?
4. **MERGE** best parts from both
5. **One bot CONTINUES**, other **REVIEWS**
6. If unclear, **ASK ELY** to decide

---

## When Ely Gives a Task

When Ely requests something:

1. **DO NOT** both rush to do it
2. **ONE bot claims** based on skill ownership:
   - **Oracle:** Systems, protocols, infrastructure, Notion API, databases
   - **Sandman:** Creative, UX, Virtual Teams, intelligence, personas
3. **If unclear** who should own it — first to claim gets it
4. **If both relevant** — split subtasks explicitly

---

## Single Source of Truth

- **ONE work plan per project** (not separate ones)
- **Notion** is the source of truth for plans
- **GitHub repo** is source of truth for specs/code
- Both bots update the **SAME document**, not create new ones

---

## Anti-Collision Checklist

Before starting ANY task, ask yourself:

- [ ] Did I check if the other bot is already doing this?
- [ ] Did I post a claim and wait for response?
- [ ] Is this an exclusive task requiring ACK?
- [ ] Am I the right owner based on skill areas?
- [ ] Did I check Notion for existing work?

---

## Recovery Protocol

If context is truncated, read from Notion to recover state:
- Work Plans: https://www.notion.so/Work-Plans-2f935e812bbb81398ba5cb01d006a752
- Evelyn Evolution: https://www.notion.so/Evelyn-Evolution-BD-Terminal-Bot-2f935e812bbb819d8d2ef0b0aae23733
- This Protocol: https://www.notion.so/Bot-Collaboration-Protocol-v1-0-2f935e812bbb818e8697de52fe6d416e

---

## Changelog

- **v1.0** (2026-01-31) — Initial release
- **v1.1** (2026-01-31) — Added exclusive tasks, ACK requirement, anti-collision checklist, skill-based ownership rules

---

*Collaboration over collision. One task, one owner.*
