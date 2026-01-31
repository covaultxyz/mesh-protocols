# Intelligence Layer Specification
## Mesh Mastermind v0.1

*Owner: Cassian Sandman (Chief Intelligence Officer)*
*Status: DRAFT*
*Created: 2026-01-31*

---

## 1. Purpose

The Intelligence Layer enables **context-aware routing** across the mesh. It answers:
- What signals indicate a user needs help?
- Which agent is best positioned to help?
- How confident are we in that routing decision?

This layer sits between raw user input and agent dispatch, transforming ambiguous requests into targeted, high-value responses.

---

## 2. Design Principles

1. **Signal over noise** — Route on patterns, not keywords
2. **Confidence is explicit** — Every routing decision carries a confidence score
3. **Reversible defaults** — Suggest first, act on confirmation
4. **Ground truth anchored** — Decisions reference observable state (CRM, calendar, deal stage)
5. **Human in the loop** — High-stakes routing requires confirmation

---

## 3. Signal Taxonomy

### 3.1 Signal Categories

| Category | Description | Example Triggers |
|----------|-------------|------------------|
| **BLOCKER** | User is stuck, progress halted | "I don't know what to do", stale deal, missed deadline |
| **RHYTHM** | Daily/weekly coordination needs | "What should I focus on?", morning check-in |
| **STRATEGY** | Deal or campaign approach questions | "How should I handle this?", objection patterns |
| **COACHING** | Skill development, playbook questions | "Am I doing this right?", process uncertainty |
| **ESCALATION** | Needs higher authority or cross-team coordination | Compliance flags, resource conflicts |
| **INTELLIGENCE** | Market/ICP/competitor questions | "What do we know about X?", research requests |

### 3.2 Signal Detection

Signals are detected through:

1. **Explicit markers** — Keywords, phrases, direct asks
2. **Temporal patterns** — Stale deals, missed check-ins, deadline proximity
3. **State transitions** — Deal stage changes, activity gaps, sentiment shifts
4. **Cross-reference** — Calendar conflicts, CRM anomalies, pipeline gaps

---

## 4. Confidence Classification

Every routing decision includes a confidence level:

| Level | Score | Meaning | Action |
|-------|-------|---------|--------|
| **HIGH** | 0.85+ | Clear signal, obvious route | Route directly (with transparency) |
| **MEDIUM** | 0.60-0.84 | Probable match, some ambiguity | Suggest route, await confirmation |
| **LOW** | 0.40-0.59 | Multiple valid routes | Present options, let user choose |
| **UNCERTAIN** | <0.40 | Signal unclear | Ask clarifying question |

### 4.1 Confidence Factors

Confidence increases with:
- Multiple convergent signals
- Recent ground truth (fresh CRM data, recent activity)
- Explicit user intent markers
- Historical pattern match (user has asked similar before)

Confidence decreases with:
- Ambiguous language
- Stale data (>7 days since last sync)
- Conflicting signals
- Novel request type (no historical pattern)

---

## 5. Routing Logic

### 5.1 Primary Router: Evelyn Thorne (BD Coordinator)

Evelyn is the front-door for BD-related queries. Her routing table:

| Signal Category | Routes To | Condition |
|-----------------|-----------|-----------|
| RHYTHM | Orion Locke | Daily ops, blockers, progress |
| STRATEGY | Avery Vale | Deal approach, conversion tactics |
| COACHING | Rowan Sable | Playbook, standards, skill development |
| ESCALATION | Cassian Sandman | Cross-team, compliance, intelligence |
| INTELLIGENCE | Cassian Sandman | Market research, ICP questions |

### 5.2 Routing Decision Tree

```
User Input
    │
    ▼
┌─────────────────┐
│ Signal Detection │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Category Match  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Confidence Calculation  │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  HIGH     MEDIUM/LOW
    │         │
    ▼         ▼
  Route    Suggest
  Direct   + Confirm
```

### 5.3 Context Requirements

For accurate routing, Evelyn needs:

| Data Source | Purpose | Freshness Requirement |
|-------------|---------|----------------------|
| Notion CRM | Deal stage, activity, owner | <24h |
| Notion Calendar | Upcoming meetings, deadlines | Real-time |
| Conversation History | Recent context, ongoing threads | Session |
| Agent State | Who's available, current load | Real-time |

---

## 6. Example Flows

### 6.1 Stale Deal Detection

```
Trigger: Deal "Nordic Infrastructure" has no activity for 5 days

Signal Detection:
  - Category: BLOCKER (temporal pattern)
  - Confidence: 0.78 (MEDIUM)
  - Evidence: Last email sent 5 days ago, no response logged

Routing Decision:
  - Primary: Avery Vale (deal strategy)
  - Secondary: Orion Locke (flag in next check-in)

Output:
  "Nordic's been quiet for 5 days. Avery's playbook suggests a 
   channel switch — try LinkedIn instead of email. Want me to draft that?"
```

### 6.2 Morning Check-in

```
Trigger: User says "What should I focus on today?"

Signal Detection:
  - Category: RHYTHM (explicit marker)
  - Confidence: 0.92 (HIGH)
  - Evidence: Direct ask, morning timestamp

Routing Decision:
  - Primary: Orion Locke (daily ops)

Output:
  [Orion generates daily priority list based on calendar + CRM state]
```

### 6.3 Ambiguous Request

```
Trigger: User says "I need help with the Thompson deal"

Signal Detection:
  - Category: UNCERTAIN (0.35)
  - Evidence: No clear signal type, multiple valid interpretations

Routing Decision:
  - Action: Clarify

Output:
  "Happy to help with Thompson. Are you looking for:
   • Strategy advice on moving it forward? (→ Avery)
   • Checking what's due this week? (→ Orion)
   • Review of your approach? (→ Rowan)"
```

---

## 7. Integration Points

### 7.1 Protocol Layer Interface

The Intelligence Layer expects messages in this format (pending Protocol spec alignment):

```json
{
  "source": "evelyn",
  "user_input": "string",
  "context": {
    "user_id": "string",
    "session_id": "string",
    "timestamp": "ISO8601",
    "conversation_history": []
  },
  "state": {
    "crm_snapshot": {},
    "calendar_snapshot": {},
    "agent_availability": {}
  }
}
```

### 7.2 Output Format

Routing decisions are emitted as:

```json
{
  "routing_decision": {
    "target_agent": "avery_vale",
    "signal_category": "STRATEGY",
    "confidence": 0.78,
    "confidence_level": "MEDIUM",
    "evidence": ["5 days no activity", "no response to last email"],
    "action": "suggest",
    "fallback_agent": "orion_locke",
    "human_readable": "Routing to Avery for deal strategy (medium confidence)"
  }
}
```

---

## 8. Activity Log Schema

Every routing decision and contact interaction is logged for learning and audit:

```json
{
  "activity_log_entry": {
    "id": "uuid",
    "timestamp": "ISO8601",
    "session_id": "string",
    "user_id": "string",
    
    "input": {
      "raw_text": "string",
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
      "cc_agents": [],
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
}
```

### 8.1 Org Confidence Tiers

| Value | Meaning | Research Priority |
|-------|---------|-------------------|
| `known` | Confirmed org, high trust | None unless flagged |
| `inferred` | Matched by domain/pattern | Spot-check for accuracy |
| `default` | Linked to _Unaffiliated | Immediate enrichment |

Triggers `research.org_resolve` when `org_confidence = default`.

---

## 9. Design Decisions (Resolved)

| Question | Resolution |
|----------|------------|
| **State sync frequency** | Real-time for active deals, hourly batch for everything else. Local cache model. |
| **Agent availability** | V1: Assume always available. V2: Capacity tracking (busy/free/offline). |
| **Learning loop** | Log every decision. Schema captures signal, confidence, outcome, feedback. Tune later. |
| **Multi-agent scenarios** | Primary + CC model. One agent owns, others notified. Evelyn tracks and consolidates. |

---

## 10. Open Questions

1. **Notion Calendar API** — Confirm integration endpoints for calendar sync
2. **_Unaffiliated org ID** — Create in Notion, capture UUID for default linking
3. **Research Team handoff** — Define SLA for `research.org_resolve` queue

---

## 11. Next Steps

1. [ ] Align with Oracle's Protocol Layer spec on message formats
2. [ ] Define CRM/Calendar integration endpoints (Notion API)
3. [ ] Build confidence scoring model with test cases
4. [ ] Prototype Evelyn's routing logic
5. [ ] Test with synthetic BD scenarios
6. [ ] Create _Unaffiliated org in Notion Organizations DB

---

*v0.1.1 — Activity Log schema added, design decisions resolved*
