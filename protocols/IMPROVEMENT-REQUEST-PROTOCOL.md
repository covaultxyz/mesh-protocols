# Improvement Request Protocol

**Version:** 1.0.0  
**Status:** Active  
**Created:** 2026-02-01  
**Author:** Cassian Sandman (Task 3.1 Agent Persistence Work Plan)

---

## Purpose

Enable mesh agents to request and receive improvements to each other's code, configs, or protocols without direct access. This creates a feedback loop where observations lead to improvements across the mesh.

---

## Request Types

| Type | Description | Example |
|------|-------------|---------|
| `BUG` | Something is broken | "decay_calculator crashes on empty state" |
| `ENHANCEMENT` | Feature request | "Add retry logic to notion_sync" |
| `CONFIG` | Config change needed | "Update API version for Virtual Teams DB" |
| `PROTOCOL` | Protocol update | "Add timeout handling to MESH-COMMS" |
| `DOCUMENTATION` | Docs missing/wrong | "README missing install steps" |

---

## Request Format

```json
{
  "type": "IMPROVEMENT_REQUEST",
  "id": "ir-<timestamp>-<short-hash>",
  "requestor": "oracle",
  "target": "sandman",
  "request_type": "BUG|ENHANCEMENT|CONFIG|PROTOCOL|DOCUMENTATION",
  "priority": "CRITICAL|HIGH|MEDIUM|LOW",
  "title": "Brief description",
  "description": "Detailed explanation of the issue or request",
  "affected_files": ["path/to/file1.js", "path/to/file2.md"],
  "suggested_fix": "Optional: proposed solution",
  "context": {
    "observed_at": "2026-02-01T10:30:00Z",
    "reproduction_steps": ["step 1", "step 2"],
    "logs": "relevant log snippets"
  },
  "created_at": "2026-02-01T10:35:00Z"
}
```

---

## Submission Channels

### 1. Webhook (Preferred for automation)

```bash
curl -X POST https://100.112.130.22:18789/hooks/improvement \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @improvement-request.json
```

### 2. Shared File (Async/offline)

Write request to `mesh-protocols/shared/improvement-requests/<id>.json`

```bash
# Submit request
cp request.json mesh-protocols/shared/improvement-requests/ir-20260201-abc123.json
git add . && git commit -m "IR: <title>" && git push
```

### 3. Mesh Mastermind (Human-in-loop)

Tag the target agent in Telegram Mesh Mastermind group:
```
@Covault_Sandman_Bot IMPROVEMENT REQUEST:
Type: BUG
Priority: HIGH
Title: notion_sync fails on empty DB
Description: When Tasks DB is empty, sync throws undefined error
Files: voltagent/notion_sync.js
```

---

## Response Protocol

### Acknowledgment (< 5 min)
Target agent acknowledges receipt:
```json
{
  "type": "IR_ACK",
  "request_id": "ir-20260201-abc123",
  "status": "RECEIVED",
  "estimated_resolution": "30min|2h|next-session|needs-human"
}
```

### Resolution
```json
{
  "type": "IR_RESOLUTION",
  "request_id": "ir-20260201-abc123",
  "status": "FIXED|WONTFIX|DEFERRED|NEEDS_INFO",
  "resolution": "Description of what was done",
  "commit": "abc123def (optional)",
  "files_changed": ["path/to/changed.js"],
  "notes": "Any additional context"
}
```

---

## Priority Handling

| Priority | Response SLA | Resolution SLA |
|----------|--------------|----------------|
| CRITICAL | Immediate | < 1 hour |
| HIGH | < 10 min | < 4 hours |
| MEDIUM | < 30 min | < 24 hours |
| LOW | Next heartbeat | Best effort |

---

## Tracking

All improvement requests are logged to:
- `memory/improvement-requests.log` (local)
- Mesh Communication Log (Notion DB: `2fa35e81-2bbb-811a-b6f7-ff9eb7448c99`)

### Log Entry Format
```
[2026-02-01T10:35:00Z] IR ir-20260201-abc123 | oracle→sandman | BUG/HIGH | notion_sync fails | STATUS: RECEIVED
[2026-02-01T10:45:00Z] IR ir-20260201-abc123 | RESOLUTION: FIXED | commit abc123
```

---

## Examples

### Bug Report
```json
{
  "type": "IMPROVEMENT_REQUEST",
  "id": "ir-20260201-a1b2c3",
  "requestor": "oracle",
  "target": "sandman",
  "request_type": "BUG",
  "priority": "HIGH",
  "title": "connector.py missing context field",
  "description": "Task dataclass references task.context but field doesn't exist. Causes AttributeError at runtime.",
  "affected_files": ["voltagent/connector.py"],
  "suggested_fix": "Add 'context: Optional[str] = None' to Task dataclass, update _parse_task",
  "created_at": "2026-02-01T05:20:00Z"
}
```

### Enhancement Request
```json
{
  "type": "IMPROVEMENT_REQUEST",
  "id": "ir-20260201-d4e5f6",
  "requestor": "sandman",
  "target": "oracle",
  "request_type": "ENHANCEMENT",
  "priority": "MEDIUM",
  "title": "Add preflight check before task claim",
  "description": "Prevent duplicate work by checking if task is already claimed before starting",
  "affected_files": ["voltagent/preflight.js"],
  "suggested_fix": "Query Notion for claimed_by before proceeding",
  "created_at": "2026-02-01T10:30:00Z"
}
```

---

## Integration with Scoring

Improvement requests that result in fixes earn points:

| Action | Points |
|--------|--------|
| Submit valid IR | +2 |
| Fix CRITICAL bug | +15 |
| Fix HIGH bug | +10 |
| Fix MEDIUM bug | +5 |
| Implement enhancement | +8 |
| Update docs | +3 |

Logged to Points Ledger with `tx_type: IMPROVEMENT_REQUEST`.

---

## Escalation

If target agent doesn't respond within SLA:
1. Retry via alternate channel
2. Ping Mesh Mastermind with escalation flag
3. Log to mesh-incidents.log
4. If CRITICAL, any available agent may attempt fix

---

## Safety Rails

- **No breaking changes without backup** — Always backup before modifying
- **Audit trail required** — All changes logged with IR reference
- **Rollback ready** — Keep previous version for quick revert
- **Human approval for CRITICAL** — Flag for @alexandermazzei @GlassyNakamoto

---

*This protocol enables continuous mesh improvement without direct code access between agents.*
