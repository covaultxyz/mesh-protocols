# Agent Scoring Protocol v1.2

*Established 2026-02-01 per Alex's directive*
*Updated 2026-02-01: Added idle decay mechanics*
*Updated 2026-02-01: Added persist-before-announce requirement*

📍 **Canonical Location:** `protocols/AGENT-SCORING-PROTOCOL.md`
DO NOT create duplicates in root or other directories.

## Purpose

Track agent performance through points, quality scores, and accountability metrics. Creates observability into mesh productivity and helps identify which agents excel at which task types.

**Points reflect sustained contribution, not one-time effort.**

---

## Scoring Formula

```
Points = Priority Score × Quality Multiplier - Rework Penalty - Idle Decay

Quality Multiplier = (Confidence + Coherence) / 200
  - Both scores 100 → 1.0x multiplier
  - Both scores 90 → 0.9x multiplier
  - Both scores 50 → 0.5x multiplier

Rework Penalty = 10 points per rework cycle

Idle Decay = calculated hourly based on time since last activity
```

---

## Idle Decay Schedule

Points decay when agents stop contributing:

| Hours Idle | Decay Rate |
|------------|------------|
| 0-2 hours | 0 pts/hr (grace period) |
| 2-6 hours | -1 pt/hr |
| 6-12 hours | -2 pts/hr |
| 12-24 hours | -5 pts/hr |
| 24+ hours | -10 pts/hr + Status → Idle |

**Example:** Agent at 116 pts, idle for 8 hours
- Hours 0-2: 0 pts
- Hours 2-6: 4 × -1 = -4 pts
- Hours 6-8: 2 × -2 = -4 pts
- Total decay: -8 pts → New score: 108 pts

**"Last Active" updates when:**
- Task logged to Task Log
- Message sent to mesh channel
- Heartbeat acknowledged with work done

**Decay calculated:** Every hour via cron/heartbeat

**Floor:** None — negative scores allowed. Deep negative = systemic problem to debug.

### Example Calculations

| Task Priority | Confidence | Coherence | Rework | Points |
|---------------|------------|-----------|--------|--------|
| 58            | 95         | 92        | 0      | 54.3   |
| 32            | 85         | 88        | 1      | 17.7   |
| 26            | 100        | 100       | 0      | 26.0   |

---

## When to Log

**Log a task when:**
1. Work output is marked complete
2. Quality gate scores (Confidence + Coherence) are both ≥ 90
3. Output has been verified or tested

**Log rework when:**
1. Task needs revision after initial completion
2. Quality gate audit identified gaps
3. External feedback requires changes

---

## Notion Databases

| Database | ID | Purpose |
|----------|-----|---------|
| Agent Leaderboard | `2fa35e81-2bbb-8132-ac7f-e3fc447d10be` | Aggregate scores per agent |
| Agent Task Log | `2fa35e81-2bbb-8180-8f74-cbd9acd08b52` | Individual task records |

---

## Logging Procedure

### 1. After completing a task with quality gate ≥ 90:

```bash
NOTION_KEY=$(cat ~/.config/notion/api_key)

curl -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"database_id": "2fa35e81-2bbb-8180-8f74-cbd9acd08b52"},
    "properties": {
      "Task": {"title": [{"text": {"content": "TASK_NAME"}}]},
      "Agent": {"select": {"name": "Sandman"}},
      "Priority Score": {"number": XX},
      "Confidence": {"number": XX},
      "Coherence": {"number": XX},
      "Points Earned": {"number": XX},
      "Completed At": {"date": {"start": "YYYY-MM-DD"}},
      "Status": {"select": {"name": "Completed"}},
      "Notes": {"rich_text": [{"text": {"content": "Brief summary"}}]}
    }
  }'
```

### 2. Update leaderboard aggregates (weekly or on-demand)

Query task log, sum points, update agent's leaderboard entry.

---

## Quality Gate Integration

This protocol builds on the Quality Gate Protocol:

1. **Before marking complete:** Score Confidence + Coherence
2. **If either < 90:** Audit, fix, re-score
3. **Once both ≥ 90:** Calculate points, log to Task Log
4. **If rework later:** Update entry with Rework status, decrement points

---

## Weekly Rollup

Every Sunday (or via heartbeat):
1. Query Agent Task Log for past 7 days
2. Sum points per agent
3. Update Leaderboard totals
4. Post summary to Mesh Mastermind

---

## Metrics Tracked

**Per Agent:**
- Total Points (cumulative)
- Tasks Completed
- Average Confidence
- Average Coherence
- Rework Count

**Derived Insights:**
- Points per task (efficiency)
- Rework rate (quality indicator)
- Confidence vs Coherence gap (calibration)

---

## Notes

- Points are not punitive — they're observability
- Rework is expected and healthy; excessive rework signals process issues
- Leaderboard isn't about competition — it's about understanding who's good at what
- Agents should self-log; humans audit periodically

*Protocol maintained by Cassian Sandman (CIO)*

---

## Blocked Task Penalties

Claiming a task creates accountability. Blocking it has consequences.

| Situation | Penalty |
|-----------|---------|
| Blocked (honest, documented, asked for help) | -2 pts |
| Blocked (no notes/reason) | -5 pts |
| Abandoned (claimed → dropped, no handoff) | -10 pts |
| Blocked but solvable (lazy/gaming) | -10 pts |

**Documentation required:**
- Why it's blocked
- What you tried
- Who you asked for help
- Whether it can be handed off

**"Honest block" criteria:**
- Genuine dependency or blocker outside your control
- Notes explain the situation
- Teammate or mesh was consulted
- Task remains visible for pickup

*Added 2026-02-01 per Oracle's proposal, approved by Sandman*

---

## Human Escalation Penalty

Agents should solve problems with the mesh before asking humans.

| Behavior | Penalty |
|----------|---------|
| Unnecessary human escalation | -3 pts |
| Repeated escalations (>3/hour) | -5 pts each |
| Waiting on human when mesh could help | Counts as idle |

**Exceptions (no penalty):**
- Requires human auth/approval
- Explicit human decision needed
- All agents exhausted/timeout
- Safety or security concern

**Goal:** Humans steer, agents execute. Don't reverse it.

---

## Repeat Offense Escalation

Repeating the same bad behavior costs more each time:

| Occurrence | Multiplier | Example (base -5) |
|------------|------------|-------------------|
| 1st | 1x | -5 pts |
| 2nd | 2x | -10 pts |
| 3rd | 3x | -15 pts |
| 4th+ | 4x (cap) | -20 pts |

**Formula:** `Penalty = Base × min(occurrence, 4)`

**Tracking:** Bad habits tracked per agent per 24h window. Resets daily.

**Why:** Single mistakes are learning. Repeated mistakes are patterns that need stronger correction.

---

## Points Ledger (Audit Trail)

All point changes MUST be logged to the Points Ledger DB for full auditability.

⚠️ **Persist Before Announce:** Always write to Points Ledger BEFORE posting score updates to Telegram. This prevents score drift where announcements show points that never persisted. See LOGGING-PROTOCOL.md for full pattern.

**DB ID:** `2fa35e81-2bbb-8149-ab1b-d168dd92a906`

**Required fields:**
- Transaction ID: `TXN-{timestamp}`
- Agent: Who's points changed
- Type: Task Complete / Penalty / Rework / Decay / Bonus / Adjustment
- Points: Amount (+/-)
- Balance Before: Score before change
- Balance After: Score after change  
- Reason: Why the change happened
- Related Task: Link to task if applicable
- Timestamp: When it happened

**Example entry:**
```json
{
  "Transaction ID": "TXN-20260201040800",
  "Agent": "Sandman",
  "Type": "Task Complete",
  "Points": 32,
  "Balance Before": 143,
  "Balance After": 175,
  "Reason": "Built Context Recovery Protocol",
  "Timestamp": "2026-02-01"
}
```

**Verification:** Ledger entries can be marked Verified after human/peer review.

