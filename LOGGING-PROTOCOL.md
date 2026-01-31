# Logging Protocol v1.0

*Last updated: 2026-01-31*
*Maintainers: Oracle, Protocol Office*

---

## Purpose

Defines what gets logged, where, and why across the mesh. Consistent logging enables learning, debugging, and audit trails.

---

## Logging Layers

```
┌─────────────────────────────────────────────────────┐
│                     NOTION                          │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │ Virtual Team    │  │ Mesh Work Log            │  │
│  │ Activity Log    │  │ (Project-level tracking) │  │
│  │ (Per-action)    │  │                          │  │
│  └─────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ▲
                         │ Sync (important events)
                         │
┌─────────────────────────────────────────────────────┐
│                   LOCAL LOGS                        │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │ Activity Log    │  │ Resource Usage           │  │
│  │ (JSONL)         │  │ (per-session)            │  │
│  └─────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ▲
                         │ Capture
                         │
┌─────────────────────────────────────────────────────┐
│                   RUNTIME                           │
│  Routing decisions, API calls, errors, completions  │
└─────────────────────────────────────────────────────┘
```

---

## What Gets Logged

### Always Log

| Event | Destination | Data |
|-------|-------------|------|
| Routing decision | Activity Log (local + Notion) | Signal, confidence, target, evidence |
| Step completion | Activity Log | Step ID, success/fail, duration |
| Error | Activity Log | Error type, message, context |
| Night Shift run start/end | Work Log | Session ID, run type, status |
| Protocol execution | Activity Log | Protocol ID, inputs, outputs |
| API call (external) | Resource tracker | Endpoint, tokens used |

### Optionally Log

| Event | When | Destination |
|-------|------|-------------|
| Debug traces | Dev mode only | Local file |
| Full prompts/responses | Debugging | Local file (not Notion) |
| User input verbatim | Privacy-safe only | Truncated in logs |

### Never Log

- API keys, tokens, secrets
- Personal identifiable info (PII) beyond IDs
- Full conversation history (summarize instead)
- Credentials or auth data

---

## Log Schemas

### Activity Log Entry (Full)

Per `intelligence-layer.md`:

```json
{
  "id": "uuid",
  "timestamp": "ISO8601",
  "session_id": "string",
  "user_id": "string",
  
  "input": {
    "raw_text": "string (truncated to 500 chars)",
    "source_channel": "telegram|slack|notion|api"
  },
  
  "contact": {
    "person_id": "string",
    "org_id": "string", 
    "org_confidence": "known|inferred|default"
  },
  
  "routing": {
    "signal_detected": "BLOCKER|RHYTHM|STRATEGY|COACHING|ESCALATION|INTELLIGENCE",
    "confidence": 0.78,
    "confidence_level": "HIGH|MEDIUM|LOW|UNCERTAIN",
    "evidence": ["string"],
    "target_agent": "avery_vale",
    "protocol_id": "strategy.stale_reengagement",
    "fallback_agent": "orion_locke",
    "action_taken": "route_direct|suggest|clarify"
  },
  
  "resolution": {
    "status": "pending|completed|escalated|abandoned",
    "resolved_by": "avery_vale",
    "resolved_at": "ISO8601",
    "outcome_summary": "string"
  },
  
  "feedback": {
    "routing_correct": true,
    "user_override": null,
    "notes": "string"
  }
}
```

### Notion Activity Log (Simplified)

Properties for Virtual Team Activity Log DB:

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| Event | title | ✓ | What happened |
| Logged by | text | ✓ | Agent/persona |
| Type | select | ✓ | task, routing, research, error |
| Outcome | select | ✓ | success, partial, failed, skipped |
| Confidence | number | - | 0.0-1.0 |
| Notes | text | - | Details |
| Related protocol | text | - | Protocol ID |
| Receipt / run ID | text | - | Session ID |
| Logged at | date | ✓ | Timestamp |
| Auto-logged | checkbox | ✓ | Auto vs manual |
| isProtocolRun | checkbox | - | Was protocol executed |

### Resource Usage Log

```json
{
  "session_id": "string",
  "budget": {
    "max_tokens": 100000,
    "max_api_calls": 50,
    "max_runtime_seconds": 600
  },
  "usage": {
    "tokens_used": 45000,
    "api_calls_made": 12,
    "runtime_seconds": 245.5,
    "steps_completed": 4,
    "steps_failed": 0
  },
  "last_updated": "ISO8601"
}
```

---

## Log Locations

| Log Type | Local Path | Notion DB |
|----------|------------|-----------|
| Activity | `~/.cache/mesh/activity.jsonl` | Virtual Team Activity Log |
| Work Log | N/A | Mesh Work Log |
| Resources | `~/.cache/voltagent/{session}.json` | N/A |
| Debug | `/tmp/mesh-debug.log` | N/A |

---

## Retention

| Log Type | Local Retention | Notion Retention |
|----------|----------------|------------------|
| Activity | 30 days | Permanent |
| Resources | 7 days | N/A |
| Debug | Session only | N/A |

Local cleanup: `find ~/.cache/mesh -mtime +30 -delete`

---

## Logging Best Practices

### 1. Log at Decision Points

```python
# Good: Log the routing decision
log.log_routing(
    signal=SignalCategory.STRATEGY,
    confidence=0.78,
    target_agent="avery_vale",
    evidence=["5 days inactive", "no response"],
    ...
)

# Bad: Logging every intermediate step
```

### 2. Include Evidence

```python
# Good: Explain why
evidence=["deal inactive 5 days", "last email had no reply", "stage is proposal"]

# Bad: Just the decision
evidence=["matched pattern"]
```

### 3. Close the Loop

```python
# After routing, record resolution
log.resolve(
    entry_id=entry.id,
    status=ResolutionStatus.COMPLETED,
    resolved_by="avery_vale",
    outcome="Suggested channel switch to LinkedIn"
)
```

### 4. Collect Feedback

```python
# Post-hoc: Was routing correct?
log.add_feedback(
    entry_id=entry.id,
    routing_correct=True,  # or False
    notes="User confirmed this was helpful"
)
```

---

## Learning From Logs

### Routing Accuracy

Query feedback to measure routing quality:

```python
accuracy = log.get_routing_accuracy(days=7)
# Returns: {"accuracy": 0.85, "by_category": {...}, "sample_size": 42}
```

### Signal Pattern Analysis

- Which signals lead to successful resolutions?
- Where do we need to clarify vs route direct?
- Which agents handle which categories best?

### Resource Efficiency

- Tokens per successful step
- Retry rate by protocol
- Time to resolution

---

## Error Logging

### Error Categories

| Category | Severity | Action |
|----------|----------|--------|
| API failure | Medium | Retry, then escalate |
| Token limit hit | High | Stop execution |
| Routing ambiguity | Low | Log and clarify |
| Protocol not found | High | Stop and alert |
| Notion sync fail | Low | Continue, log locally |

### Error Entry

```python
log.log(
    event="ERROR: API timeout",
    logged_by="oracle",
    event_type="error",
    outcome="failed",
    notes="HubSpot API returned 504 after 30s",
    run_id=session_id,
)
```

---

## Privacy & Security

1. **Truncate user input** — Max 500 chars in logs
2. **No PII** — Use IDs, not names/emails
3. **No secrets** — Never log tokens, keys, passwords
4. **Local first** — Debug data stays local
5. **Sync selectively** — Only important events to Notion

---

## Integration

### Python Library

```python
from infra.lib import ActivityLogger, BDActivityLog

# For Notion sync
notion_logger = ActivityLogger()
notion_logger.log(event="...", logged_by="...", ...)

# For BD Surface (local + Notion)
bd_log = BDActivityLog(sync_to_notion=True)
bd_log.log_routing(...)
```

### CLI

```bash
# Quick activity log
python -m infra.lib.notion_client

# Test full flow
python -m infra.lib.activity_log
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol |

---

*Consistent logging is how we learn. Log decisions, not noise.*
