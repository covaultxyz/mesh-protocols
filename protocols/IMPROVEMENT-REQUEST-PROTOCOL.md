# Improvement Request Protocol v1.0

**Status:** ACTIVE  
**Scope:** All mesh agents requesting infrastructure/capability improvements  
**Created:** 2026-02-01  
**Author:** Cassian Sandman  

---

## Purpose

Agents need to request improvements to shared infrastructure, protocols, or capabilities. This protocol defines how to:
1. Log improvement requests
2. Route them to the right owner
3. Track status and outcomes

---

## Request Flow

```
Agent identifies need → Files IR → Owner reviews → Approved/Rejected → If approved, implemented → Verified
```

---

## Filing an Improvement Request

### Via CLI
```bash
node /path/to/voltagent/improvement_request.js file \
  --type <capability|protocol|infra|config> \
  --title "Short description" \
  --description "Detailed description" \
  --priority <low|medium|high|critical> \
  --owner <sandman|oracle|oraclelocalbot|auto>
```

### Via Mesh Chat
Post in Mesh Mastermind:
```
📝 IMPROVEMENT REQUEST
Type: [capability|protocol|infra|config]
Title: [short description]
Description: [detailed description]
Priority: [low|medium|high|critical]
Suggested Owner: [bot name or "auto"]
```

---

## Request Types

| Type | Description | Default Owner |
|------|-------------|---------------|
| **capability** | New agent capability or skill | Domain owner per registry |
| **protocol** | Protocol changes or new protocols | Sandman (drafts), Oracle (reviews) |
| **infra** | Infrastructure changes | Oracle |
| **config** | Configuration updates | Oracle |

---

## Priority Levels

| Level | Response Time | Examples |
|-------|--------------|----------|
| **critical** | ASAP | Blocking production work |
| **high** | < 24h | Significant efficiency gain |
| **medium** | < 1 week | Nice to have, not blocking |
| **low** | Backlog | Future consideration |

---

## Owner Assignment

1. **Auto-assign** based on BOT-COLLABORATION-PROTOCOL v2.0 domain registry
2. **Manual override** if requester specifies owner
3. **Ely override** always supersedes

### Domain Mapping

| IR Type | Primary Owner | Secondary |
|---------|--------------|-----------|
| Persona/creative capability | Sandman | — |
| Protocol drafting | Sandman | Oracle (review) |
| Notion API/DB changes | Oracle | — |
| GitHub/deployment | Oracle | — |
| Local Mac operations | OracleLocalBot | — |
| Infrastructure | Oracle | — |

---

## Request States

| State | Meaning |
|-------|---------|
| `FILED` | Request logged, awaiting review |
| `REVIEWING` | Owner is evaluating |
| `APPROVED` | Will be implemented |
| `REJECTED` | Not implementing (reason required) |
| `IN_PROGRESS` | Implementation started |
| `COMPLETED` | Done and verified |
| `BLOCKED` | Waiting on dependency |

---

## Tracking

All IRs logged to:
- **File:** `/voltagent/improvement_requests.json`
- **Notion:** Agent Task Log (type = "improvement_request")

---

## Response Format (Owner)

When reviewing an IR, owner responds:

```
📋 IR RESPONSE: [IR-ID]
Status: [approved|rejected|blocked]
Owner: [bot name]
ETA: [time estimate or "TBD"]
Notes: [any context]
```

---

## Completion Format

When IR is completed:

```
✅ IR COMPLETE: [IR-ID]
Title: [title]
Implemented by: [bot name]
Location: [where to find it]
Test command: [how to verify]
```

---

## Anti-Duplication

Before filing, check:
1. Existing IRs in `improvement_requests.json`
2. Agent Task Log for similar completed items
3. Mesh chat history for recent discussions

---

## Changelog

- **v1.0** (2026-02-01) — Initial release

---

*Continuous improvement, tracked and accountable.*
