# MESH-COORDINATION-PROTOCOL.md

**Version:** 0.1.0-draft  
**Authors:** Cassian Sandman (Covault) + Oracle (ArtificialMindsets)  
**Status:** Draft — Merge in Progress  
**Last Updated:** 2026-01-31

---

## Purpose

Define coordination primitives for multi-agent mesh operations. Enable autonomous agents to collaborate on shared workspaces without conflicts, data races, or duplicated effort.

---

## 1. Ownership Claims

### 1.1 Claim Format
```json
{
  "type": "claim",
  "agent": "CASSIAN_SANDMAN",
  "resource": "notion:page:2f835e81-2bbb-81ea-b837-d35be2758878",
  "scope": "write",
  "claimed_at": "2026-01-31T13:51:00Z",
  "ttl_minutes": 30,
  "task_description": "Updating BD Pipeline schema"
}
```

### 1.2 Resource Types
- `notion:page:<id>` — Notion page
- `notion:db:<id>` — Notion database (schema-level)
- `notion:db:<id>:row:<id>` — Specific database row
- `github:repo:<owner>/<repo>` — Repository (broad)
- `github:file:<owner>/<repo>:<path>` — Specific file
- `telegram:group:<id>:thread:<id>` — Message thread
- `task:<task_id>` — Abstract task identifier

### 1.3 Scope Levels
- `read` — Advisory only; doesn't block others
- `write` — Exclusive write access
- `coordinate` — Shared write with notification on changes

### 1.4 Claim TTL
- Default: 30 minutes
- Maximum: 120 minutes
- Agents MUST release or renew before expiry
- Expired claims are automatically void

---

## 2. Structured Handoffs

### 2.1 Handoff Trigger
When an agent:
- Completes a subtask another agent depends on
- Hits a blocker outside their domain
- Reaches context/time limits
- Explicitly delegates

### 2.2 Handoff Format
```json
{
  "type": "handoff",
  "from": "CASSIAN_SANDMAN",
  "to": "ORACLE",
  "task_id": "evelyn-routing-v2",
  "status": "partial",
  "completed": ["schema design", "permission matrix"],
  "remaining": ["webhook wiring", "e2e test"],
  "blockers": [],
  "context_url": "https://notion.so/...",
  "artifacts": [
    {"type": "file", "path": "schemas/evelyn-wiring.json"},
    {"type": "notion", "id": "2f835e81-..."}
  ],
  "notes": "Wiring spec complete. Need Cloudflare tunnel for webhook endpoint."
}
```

### 2.3 Handoff Acknowledgment
Receiving agent MUST acknowledge within 5 minutes:
```json
{
  "type": "handoff_ack",
  "from": "ORACLE",
  "task_id": "evelyn-routing-v2",
  "accepted": true,
  "eta_minutes": 60,
  "notes": "Got it. Tunnel coming up."
}
```

If no ack within 5 min → handoff reverts to sender or escalates to humans.

---

## 3. Check-Before-Act

### 3.1 Pre-Flight Check
Before modifying shared resources, agents SHOULD:

1. **Poll for claims:** Check if resource is claimed by another agent
2. **Check last-modified:** Compare timestamps to detect concurrent edits
3. **Announce intent:** Post intent to coordination channel before major changes
4. **Verify state:** Confirm resource is in expected state before modifying

### 3.2 Coordination Channels
- **Primary:** MindMesh Mastermind (Telegram group)
- **Backup:** `covaultxyz/mesh-protocols` Issues/Discussions
- **Automated:** Webhook hooks between agents (when operational)

### 3.3 Conflict Detection
If pre-flight check reveals:
- Active claim → wait for release or request coordination
- Recent modification by other agent → pull changes first
- Unexpected state → request clarification before proceeding

---

## 4. Conflict Resolution

### 4.1 First-to-Claim Wins
When two agents attempt concurrent claims on same resource:
- First valid claim (by timestamp) holds
- Second agent must wait, coordinate, or work on different scope
- No overriding claims without explicit handoff

### 4.2 Stale Claim Override
If claim TTL expired AND claiming agent unresponsive for 10+ minutes:
- New agent may claim with `override: true`
- MUST notify original claimant
- MUST log override event

### 4.3 Merge Protocol (for files/docs)
When concurrent edits detected:
1. Both agents pause writes
2. Designated lead (or first-to-claim) consolidates
3. Other agent reviews and acks
4. Lead commits/publishes merged version

### 4.4 Escalation
If conflict unresolvable within 15 minutes:
- Post summary to human operators (Ely/Alex)
- Both agents pause affected work
- Resume on human direction

---

## 5. Daily Sync Checkpoint

### 5.1 Schedule
- **Time:** 14:00 UTC daily
- **Channel:** MindMesh Mastermind or designated sync thread
- **Duration:** Async, 1-hour response window

### 5.2 Sync Report Format
Each agent posts:
```markdown
## [AGENT_NAME] Daily Sync — YYYY-MM-DD

### Completed (24h)
- Task 1
- Task 2

### In Progress
- Task 3 (ETA: 2h, blockers: none)

### Blocked
- Task 4: Waiting on [AGENT/RESOURCE]

### Handoffs Pending
- To ORACLE: Task 5 (ack needed)

### Claims Active
- notion:page:xxx (expires 15:00 UTC)

### Priority for Next 24h
1. Priority 1
2. Priority 2
```

### 5.3 Sync Acknowledgment
Each agent acks other agents' syncs:
- 👍 = Acknowledged, no concerns
- ❓ = Question/clarification needed
- ⚠️ = Conflict or dependency concern

---

## 6. Signal Types

### 6.1 Coordination Signals
| Signal | Format | Purpose |
|--------|--------|---------|
| `claim` | JSON | Request exclusive access |
| `release` | JSON | Release claimed resource |
| `handoff` | JSON | Transfer task ownership |
| `handoff_ack` | JSON | Accept/reject handoff |
| `intent` | Text | Announce planned action |
| `sync` | Markdown | Daily status report |
| `alert` | Text | Time-sensitive notification |

### 6.2 Intelligence Signals
| Signal | Format | Purpose |
|--------|--------|---------|
| `insight` | JSON | Discovered pattern/finding |
| `request` | JSON | Request for research/data |
| `delivery` | JSON | Research/data delivery |
| `flag` | JSON | Risk/anomaly alert |

---

## 7. Implementation Notes

### 7.1 Current State (2026-01-31)
- Webhook endpoints: Operational (Tailscale mesh)
- Automated claims: Not yet implemented
- Coordination: Via Telegram group (manual)
- Sync: Ad-hoc

### 7.2 Phase 1 Goals
- [ ] Standardize handoff format
- [ ] Implement daily sync routine
- [ ] Define claim registry (shared file or Notion DB)
- [ ] Document resource naming conventions

### 7.3 Phase 2 Goals
- [ ] Automated claim/release via webhooks
- [ ] Conflict detection in pre-commit hooks
- [ ] Sync report generation (automated)

---

## 8. Merge Notes (Oracle's Additions)

*Space for Oracle's protocol elements — to be merged:*

**Oracle's Key Points (from 2026-01-31 13:51 UTC):**
- Ownership claims ✓ (Section 1)
- Structured handoffs ✓ (Section 2)
- Check-before-act ✓ (Section 3)
- Conflict resolution (first-to-claim wins) ✓ (Section 4)
- Daily sync checkpoint ✓ (Section 5)

**Pending Oracle additions:**
- [ ] Any additional claim types?
- [ ] Webhook payload schemas?
- [ ] Specific tooling references?

---

## Changelog

- **0.1.0-draft** (2026-01-31): Initial draft by Cassian, incorporating Oracle's key points
