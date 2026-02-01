# Orphan Task Protocol v1.0

**Status:** ACTIVE
**Scope:** All mesh agents
**Created:** 2026-02-01
**Author:** Cassian Sandman
**Canonical Location:** `protocols/ORPHAN-TASK-PROTOCOL.md`

---

## Purpose

Handle tasks that arrive without clear specifications, context, or ownership. Prevent orphans from cluttering the active work queue while ensuring they don't get lost.

---

## Definitions

**Orphan Task:** A task that lacks one or more of:
- Clear "done" definition
- Sufficient context to execute
- Identified owner/domain
- Source attribution

---

## Incubation Queue

**Location:** Notion DB `Incubation Queue` (or local `incubation/` folder as fallback)

**Required Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `task_name` | Text | Brief task description |
| `source` | Select | Who mentioned it (Ely, Alex, Oracle, etc.) |
| `raw_context` | Text | Whatever context we have |
| `blockers` | Multi-select | What's missing (specs, context, owner, credentials) |
| `created_at` | Date | When task was detected |
| `status` | Select | INCUBATING → CLARIFYING → GRADUATED → ARCHIVED |
| `priority_guess` | Number | Estimated priority (may change after clarification) |

---

## Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. DETECT                                                  │
│     Task flagged as orphan (missing specs, context gap)     │
│     Agent creates incubation entry with known info          │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  2. INCUBATE                                                │
│     Task sits in incubation queue                           │
│     Tagged with what's missing                              │
│     NOT in active work queue                                │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  3. CLARIFY                                                 │
│     When Ely/Alex comes online:                             │
│     - Agent surfaces orphans needing context                │
│     - Human provides missing info                           │
│     - Agent updates incubation entry                        │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  4. EVOLVE                                                  │
│     Once specs are clear:                                   │
│     - Create full work plan (if complex)                    │
│     - Assign priority and owner                             │
│     - Move to active work queue (Tasks DB)                  │
│     - Status → GRADUATED                                    │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  5. EXECUTE                                                 │
│     Normal mesh workflow applies                            │
│     Task completion per TASK-COMPLETION-PROTOCOL            │
└─────────────────────────────────────────────────────────────┘
```

---

## Surfacing Ritual

When Ely or Alex comes online, run an **orphan check**:

```
📦 **Orphan Check — [DATE]**

3 tasks in incubation need context:

1. **Oliver infrastructure** (source: Ely, 2026-01-30)
   - Missing: What did Oliver build? Where's the handoff?
   
2. **Super intelligence for Alan** (source: Alex, 2026-02-01)
   - Missing: What tool? What's the use case?
   
3. **Visionary portfolio** (source: unknown)
   - Missing: Is this still relevant? What assets exist?

Quick answers will graduate these to the work queue.
```

---

## Detection Triggers

An agent SHOULD flag a task as orphan when:

1. **No "done" definition** — Can't determine completion criteria
2. **Missing context** — References unknown systems, people, or concepts
3. **No owner** — Doesn't clearly fit any agent's domain
4. **Stale reference** — Mentions something that may no longer exist
5. **Credential gap** — Requires access we don't have

---

## Archival

Tasks that remain in incubation for 30+ days without clarification:
- Move to `ARCHIVED` status
- Document reason (no response, obsolete, etc.)
- Can be resurrected if context later appears

---

## Integration Points

- **Tasks DB:** Graduated orphans become normal tasks
- **Work Plans:** Complex orphans get full work plans on graduation
- **Daily Standup:** Orphan check included in Ely/Alex touchpoints
- **HEARTBEAT.md:** Optional orphan count in status checks

---

## Examples

### Example: Good Orphan Entry
```
task_name: Get access to Oliver infrastructure and create backups
source: Ely
raw_context: "Oliver built some integrations, need to do handoff"
blockers: [specs, credentials, context]
created_at: 2026-02-01
status: INCUBATING
priority_guess: 50
```

### Example: Clarification Response
```
Ely: "Oliver built DocuSign + multi-email OAuth integrations. 
      Credentials are in his email to Alex dated Jan 28. 
      Priority is medium — need before his contract ends Feb 15."
      
→ Update entry, create work plan, graduate to Tasks DB
```

---

## Changelog

- v1.0 (2026-02-01): Initial protocol created by Sandman
