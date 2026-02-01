# Task Claim Protocol

**Version:** 1.0.0
**Date:** 2026-02-01
**Status:** Active

## Purpose

Prevent duplicate work when multiple agents operate on shared task queues.

## Canonical Task Database

**Tasks DB:** `2f835e81-2bbb-81b6-9700-e18108a40b1f`

## Pre-Flight Check (MANDATORY)

Before starting ANY task from a shared queue:

```
1. Query task by ID
2. Check status:
   - IF status ≠ OPEN → SKIP (already claimed or done)
   - IF status = OPEN:
     - IF claimed_by is empty → CLAIM
     - IF claimed_by is set:
       - IF claimed_at + claim_timeout_minutes > now → SKIP (active claim)
       - ELSE → CLAIM (stale claim, can override)
3. CLAIM means:
   - Set claimed_by = [AgentName]
   - Set claimed_at = now
   - Set status = IN_PROGRESS
4. Proceed with work
5. On completion:
   - Set status = COMPLETED
   - Log to Agent Task Log for scoring
```

## Status Values

| Status | Meaning |
|--------|---------|
| OPEN | Available for claiming |
| IN_PROGRESS | Actively being worked |
| BLOCKED | Waiting on external dependency |
| COMPLETED | Work finished |
| CANCELLED | Task abandoned |

## Timeout Handling

Default `claim_timeout_minutes`: 30

If a task has been claimed but `claimed_at + timeout < now`, the claim is stale and another agent may override it.

## Race Condition Mitigation

Notion doesn't support atomic transactions. To minimize races:

1. Always query immediately before claiming
2. Use short claim windows for quick tasks
3. If you detect a conflict mid-work, check status again before finalizing
4. Log all claim attempts to Mesh Communication Log

## Agents

- **Sandman** — Claims as "Sandman"
- **Oracle** — Claims as "Oracle"

## Related Databases

| Database | ID | Purpose |
|----------|-----|---------|
| Tasks | `2f835e81-2bbb-81b6-9700-e18108a40b1f` | Main task queue |
| Agent Task Log | `2fa35e81-2bbb-8180-8f74-cbd9acd08b52` | Scoring & history |
| Mesh Communication Log | `2fa35e81-2bbb-811a-b6f7-ff9eb7448c99` | Inter-agent comms |

## Changelog

- 2026-02-01: Initial protocol created (Sandman)
