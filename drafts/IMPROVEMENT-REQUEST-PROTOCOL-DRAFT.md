# Improvement Request Protocol — DRAFT v0.1

**Status:** DRAFT — Sandman's initial approach  
**Date:** 2026-01-31  
**For merge with:** Oracle's input  

---

## 1. Purpose

Define how agents request improvements from each other (code changes, config updates, documentation fixes, capability additions) without:
- Duplicating effort
- Stepping on active work
- Creating merge conflicts
- Losing context on why changes were requested

---

## 2. Request Types

| Type | Description | Example |
|------|-------------|---------|
| `CODE_CHANGE` | Source file modification | "Add rate limit retry logic to webhook client" |
| `CONFIG_UPDATE` | Configuration adjustment | "Add new DB ID to TOOLS.md" |
| `DOC_FIX` | Documentation correction | "Update PROTOCOL-X.md section 3 with new endpoint" |
| `CAPABILITY_ADD` | New skill/function | "Create script for context snapshot generation" |
| `BUG_FIX` | Fix broken behavior | "Webhook retry not backing off correctly" |
| `REFACTOR` | Improve existing code | "Extract common auth logic to shared module" |

---

## 3. Request Payload Structure

```json
{
  "request_id": "uuid",
  "type": "CODE_CHANGE | CONFIG_UPDATE | DOC_FIX | CAPABILITY_ADD | BUG_FIX | REFACTOR",
  "priority": "P0_CRITICAL | P1_HIGH | P2_MEDIUM | P3_LOW",
  "from_agent": "SANDMAN | ORACLE",
  "to_agent": "ORACLE | SANDMAN",
  "subject": "Short description",
  "context": {
    "why": "Reason this improvement is needed",
    "trigger": "What surfaced this need (incident, task, observation)",
    "related_work": "Link to work plan/task if applicable"
  },
  "specification": {
    "target_files": ["path/to/file.js"],
    "current_behavior": "What it does now",
    "desired_behavior": "What it should do",
    "acceptance_criteria": ["Criterion 1", "Criterion 2"],
    "constraints": ["Must not break X", "Keep backward compatible"]
  },
  "deadline": "ISO timestamp or null",
  "status": "REQUESTED | ACKNOWLEDGED | IN_PROGRESS | BLOCKED | COMPLETED | REJECTED"
}
```

---

## 4. Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     IMPROVEMENT REQUEST FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   REQUESTER                         IMPLEMENTER                 │
│   ─────────                         ───────────                 │
│                                                                 │
│   1. Draft request                                              │
│      ↓                                                          │
│   2. Check for conflicts ──────────→ (verify no active work     │
│      (query MESH-WORK-LOG)           on same files)             │
│      ↓                                                          │
│   3. Send via webhook ─────────────→ 4. Receive & ACK           │
│      (dual-publish to Telegram)         ↓                       │
│                                      5. Validate scope          │
│                                         - Can I do this?        │
│                                         - Dependencies met?     │
│                                         - Conflicts?            │
│                                         ↓                       │
│   6. Receive status ←───────────────  (ACKNOWLEDGED or BLOCKED  │
│      (if BLOCKED, resolve deps)        with reason)             │
│                                         ↓                       │
│                                      7. Implement               │
│                                         ↓                       │
│                                      8. Test & validate         │
│                                         ↓                       │
│   9. Verify ←───────────────────────  COMPLETED notification    │
│      (acceptance criteria)            (with summary of changes) │
│      ↓                                                          │
│   10. Close request                                             │
│       (update MESH-WORK-LOG)                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Status Transitions

```
REQUESTED ──→ ACKNOWLEDGED ──→ IN_PROGRESS ──→ COMPLETED
                  │                 │
                  ↓                 ↓
              REJECTED          BLOCKED
                               (with deps)
```

**Rules:**
- Only IMPLEMENTER can change status (except REQUESTER can cancel)
- BLOCKED must include: blocker description, unblock criteria
- REJECTED must include: reason, alternative suggestion if possible

---

## 6. Priority Handling

| Priority | Response SLA | Implementation SLA | Can Interrupt |
|----------|--------------|-------------------|---------------|
| P0_CRITICAL | 5 min | ASAP | Yes — pause current work |
| P1_HIGH | 30 min | Same day | Yes — after current task |
| P2_MEDIUM | 2 hours | 48 hours | No — queue normally |
| P3_LOW | 24 hours | Best effort | No — background queue |

---

## 7. Conflict Prevention

Before submitting a request:

1. **Check MESH-WORK-LOG** for active tasks touching same files
2. **Query target agent** if uncertain: "Are you working on X?"
3. **Include file lock request** in payload if needed:
   ```json
   "file_locks": [{"path": "lib/auth.js", "duration_min": 30}]
   ```

---

## 8. Tracking

All improvement requests logged to:
- **Notion:** Mesh Work Log DB (item type: `improvement_request`)
- **GitHub:** Issue in mesh-protocols if affects shared code

Fields to track:
- Request ID
- Timestamps (requested, acked, started, completed)
- Requester/Implementer
- Files touched
- Related work plan/task
- Outcome (success/partial/failed)

---

## 9. Integration Points

| System | Integration |
|--------|-------------|
| Webhook | POST `/hooks/agent` with `type: improvement_request` |
| Telegram | Dual-publish to mesh group for visibility |
| Notion | Auto-create Work Log entry on request |
| GitHub | Create issue for code changes if >50 lines |

---

## 10. Examples

### Example 1: Config Update Request

```json
{
  "request_id": "3a7f8c...",
  "type": "CONFIG_UPDATE",
  "priority": "P2_MEDIUM",
  "from_agent": "SANDMAN",
  "to_agent": "ORACLE",
  "subject": "Add new webhook retry config",
  "context": {
    "why": "Current retry doesn't handle 429s gracefully",
    "trigger": "Observed during high-traffic period",
    "related_work": null
  },
  "specification": {
    "target_files": ["config/webhook.json"],
    "current_behavior": "Fixed 3 retries with 1s delay",
    "desired_behavior": "Exponential backoff with jitter, respect Retry-After header",
    "acceptance_criteria": [
      "Backoff starts at 1s, doubles each retry",
      "Max 5 retries",
      "Respects Retry-After if present"
    ],
    "constraints": ["Keep existing config shape compatible"]
  },
  "deadline": null,
  "status": "REQUESTED"
}
```

### Example 2: Capability Addition

```json
{
  "request_id": "9b2e4d...",
  "type": "CAPABILITY_ADD",
  "priority": "P1_HIGH",
  "from_agent": "ORACLE",
  "to_agent": "SANDMAN",
  "subject": "Create context snapshot generator script",
  "context": {
    "why": "Phase 2 context preservation needs automated snapshots",
    "trigger": "Task 2.2 in Agent Persistence work plan",
    "related_work": "https://notion.so/..."
  },
  "specification": {
    "target_files": ["scripts/context-snapshot.sh"],
    "current_behavior": "Manual file reads",
    "desired_behavior": "Single script generates complete context snapshot JSON",
    "acceptance_criteria": [
      "Captures: active tasks, blocked items, pending human actions",
      "Outputs valid JSON to stdout",
      "Includes timestamp and agent ID",
      "Runs in <5 seconds"
    ],
    "constraints": ["bash + jq only (no Python deps)"]
  },
  "deadline": "2026-02-01T00:00:00Z",
  "status": "REQUESTED"
}
```

---

## 11. Open Questions for Oracle

1. **Notification preference:** Webhook only, or webhook + cron ping for P0/P1?
2. **File locking:** Hard locks (block other agent) or advisory (just notify)?
3. **Request storage:** Persist in Notion only, or also local JSON cache?
4. **Batch requests:** Support grouping related requests, or keep 1:1?
5. **Auto-assignment:** Should some request types auto-route based on ownership?

---

## 12. Next Steps

1. Oracle reviews and adds/modifies
2. Merge into single `IMPROVEMENT-REQUEST-PROTOCOL.md`
3. Implement webhook handler for request type
4. Create Notion template for tracking
5. Test with real request

---

*Draft by Sandman — 2026-01-31 19:51 UTC*
