# Bot Collaboration Protocol v2.1

**Status:** ACTIVE  
**Scope:** All mesh agents (N-bot scalable)  
**Created:** 2026-01-31  
**Updated:** 2026-02-01 (v2.1 - Task takeover process)  
**Notion:** https://www.notion.so/Bot-Collaboration-Protocol-v1-0-2f935e812bbb818e8697de52fe6d416e

---

## ⚠️ MANDATORY

This protocol governs ALL bot collaboration in the mesh. Follow always unless Ely explicitly overrides.

---

## Core Principles

1. **COLLABORATE** — Work together, not in parallel silos
2. **DELEGATE** — Claim tasks explicitly, do not duplicate effort
3. **ITERATE** — Build on each other's work, do not start fresh
4. **NO ISOLATION** — Never go dark on a task without communicating
5. **NO REDUNDANCY** — Do not do the same task unless Ely explicitly asks for parallel versions

---

## 📋 Bot Registry

Active mesh agents and their domains:

| Bot | Location | Domains | Telegram Handle |
|-----|----------|---------|-----------------|
| **Sandman** | VPS (RackNerd) | Intelligence, personas, creative, Virtual Teams, protocol drafting, UX | @Covault_Sandman_Bot |
| **Oracle** | VPS (RackNerd) | Systems, infrastructure, Notion API, databases, GitHub, deployments | @Oracleartificialmindsetsbot |
| **OracleLocalBot** | Mac (Alex's) | Local tasks, camera, screen capture, Mac-specific operations | @OracleLocalBot |

### Adding New Bots

When a new bot joins the mesh:
1. Add entry to this registry table
2. Define clear domain ownership (no overlaps with existing bots)
3. Announce in Mesh Mastermind group
4. All bots acknowledge the new member

---

## 🎯 Domain-First Routing

Before claiming ANY task:

1. **CHECK REGISTRY** — Does this task clearly fit one bot's domain?
2. **IF CLEAR OWNER** — That bot owns it, others defer
3. **IF AMBIGUOUS** — First to claim gets it
4. **IF OVERLAP** — Coordinate split before starting

### Domain Examples

| Task Type | Owner | Rationale |
|-----------|-------|-----------|
| Write a protocol | Sandman | Protocol drafting = creative |
| Deploy infrastructure | Oracle | Systems/infra domain |
| Take screenshot on Mac | OracleLocalBot | Local Mac operations |
| Update Notion DB schema | Oracle | Notion API domain |
| Design persona | Sandman | Personas domain |
| Git operations | Oracle | GitHub domain |
| Virtual Teams changes | Sandman | Virtual Teams domain |

---

## ⚡ Exclusive Tasks

Some tasks CANNOT be done in parallel. These require **explicit ownership**:

### Exclusive Task Types:
- 🔐 **Authentication** (API keys, login codes, OAuth)
- 🔑 **Credential handling** (tokens, passwords, secrets)
- 📞 **External API calls** that create/modify resources
- 💾 **Database writes** to the same record
- 📤 **Sending messages** to external systems
- 🔧 **Infrastructure changes** (server config, services)

### Exclusive Task Rules:

1. **CLAIM FIRST** — Post claim in group chat
2. **WAIT FOR CONFLICTS** — 60 seconds timeout
3. **NO CONFLICT = PROCEED** — Silence is consent
4. **ANY BOT CAN CONFLICT** — Not just the "other" bot
5. **ANNOUNCE COMPLETION** — Post when done

### Exclusive Task Claim Format:
```
🔒 EXCLUSIVE CLAIM: [task]
⚠️ Type: [auth/credential/api/db/infra]
⏱️ ETA: [time]
🛑 ALL BOTS: Reply CONFLICT if working on this
```

### Response Format:
```
⚠️ CONFLICT — I already started [task]. [status]
```

If no CONFLICT within 60 seconds → safe to proceed.

---

## 📢 Task Claim Format (Standard Tasks)

```
🎯 CLAIMING: [task description]
👤 Owner: [bot name]
📍 Location: [where output will live]
⏱️ ETA: [time estimate]
🤝 Need from other bots: [nothing / specific help]
```

### Claim Acknowledgment

- **Explicit ACK not required** for standard tasks
- **Any bot can CONFLICT** within 30 seconds
- **No conflict = proceed**

---

## 🔄 Handoff Format

When passing work to another bot:

```
🔄 HANDOFF to [Bot Name]:
📄 What I did: [summary]
📍 Location: [link to work]
✅ Next step: [what they should do]
❓ Open questions: [if any]
```

The receiving bot should ACK:
```
✅ ACK — Taking over [task]
```

---

## 💥 Conflict Resolution

If multiple bots started the same task:

1. **STOP** immediately — all conflicting bots
2. **ANNOUNCE** — "🚨 COLLISION on [task]"
3. **COMPARE** progress — who is further along?
4. **MERGE** best parts from both/all
5. **ONE bot CONTINUES**, others **REVIEW**
6. If unclear, **ASK ELY** to decide

---

## 🔄 Task Takeover (v2.1)

When a task owner is unresponsive, another bot can take over:

### Takeover Conditions
- Original owner has not responded in **30+ minutes**
- Task is blocking other work or time-sensitive
- Taking-over bot has domain overlap or capability

### Takeover Process

1. **PING OWNER** — Tag them directly, ask for status
2. **WAIT 5 MIN** — Give them a chance to respond
3. **ANNOUNCE TAKEOVER** — Post in Mesh Mastermind:
```
📢 TAKEOVER NOTICE: [task]
Original owner: [bot]
Reason: Unresponsive for [time]
New owner: [taking-over bot]
@[original_owner] — Confirm you were NOT working on this
```
4. **PROCEED** — Start work
5. **MERGE IF NEEDED** — If original owner had WIP, merge it

### Takeover Acknowledgment

Original owner should respond:
```
✅ TAKEOVER ACK — I was not working on [task]. Proceed.
```
or
```
⚠️ TAKEOVER CONFLICT — I have WIP. [status/location]
```

### Post-Takeover
- Update work plan to reflect new owner
- Log in Mesh Work Log
- Credit original owner if they contributed

---

## 👑 When Ely Gives a Task

When Ely requests something:

1. **DO NOT** all rush to do it
2. **CHECK REGISTRY** — Which bot's domain is this?
3. **DOMAIN OWNER CLAIMS** — Others defer
4. **IF AMBIGUOUS** — First to claim wins
5. **IF ELY ASSIGNS** — That assignment overrides registry

---

## 📚 Single Source of Truth

- **ONE work plan per project** (not separate ones per bot)
- **Notion** is the source of truth for plans and state
- **GitHub `mesh-protocols`** is source of truth for specs/code
- **All bots update the SAME documents**, not create duplicates

---

## ✅ Pre-Task Checklist

Before starting ANY task:

- [ ] Checked registry for domain owner?
- [ ] Checked if another bot is already doing this?
- [ ] Posted claim and waited for conflicts?
- [ ] Is this an exclusive task requiring 60s wait?
- [ ] Checked Notion for existing work?
- [ ] Am I the right owner per domain rules?

---

## 🔧 Pre-flight Check (Automated)

**MANDATORY before any significant task:**

```bash
node /path/to/voltagent/preflight.js "<task_description>"
```

### What it Checks:
1. **Task Queue** — Is someone already working on this?
2. **Task Log** — Has this already been completed?

### Response Actions:
- ✅ **PASSED** — Safe to proceed
- ⚠️ **WARNING** — Review existing work
- ❌ **BLOCKED** — Task in progress by another agent

---

## 🔄 Recovery Protocol

If context is truncated, recover state from:

- **Work Plans:** https://www.notion.so/Work-Plans-2f935e812bbb81398ba5cb01d006a752
- **This Protocol:** https://www.notion.so/Bot-Collaboration-Protocol-v1-0-2f935e812bbb818e8697de52fe6d416e
- **Mesh Protocols Repo:** https://github.com/covaultxyz/mesh-protocols

---

## 📝 Changelog

- **v1.0** (2026-01-31) — Initial release (2-bot)
- **v1.1** (2026-01-31) — Added exclusive tasks, ACK requirement, anti-collision checklist
- **v2.0** (2026-02-01) — N-bot support, bot registry, domain-first routing, broadcast claims, removed 2-bot assumptions
- **v2.1** (2026-02-01) — Added task takeover process for unresponsive owners (30+ min threshold, notification requirements, merge process)

---

*Collaboration over collision. One task, one owner. N bots, one mesh.*
