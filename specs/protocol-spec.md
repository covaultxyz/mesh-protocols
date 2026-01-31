# PROTOCOL-SPEC.md — Team Protocol Definitions v0.1

*Owner: Oracle*
*Status: DRAFT*
*Created: 2026-01-31*

---

## Protocol Message Format

### Protocol Request (from Intelligence Layer)

```json
{
  "protocol_id": "string",
  "target_agent": "string",
  "routing_decision": { /* from Intelligence Layer */ },
  "context": {
    "user_id": "string",
    "session_id": "string",
    "relevant_state": {}
  },
  "triggered_at": "ISO8601"
}
```

### Protocol Response (back to Evelyn)

```json
{
  "protocol_id": "string",
  "status": "completed|pending|escalated",
  "response": {
    "message": "string",
    "actions_taken": [],
    "follow_up_required": "boolean",
    "next_protocol": "string|null"
  },
  "logged_as": {
    "signal": "string",
    "confidence": 0.00,
    "routed_to": "string",
    "protocol_id": "string",
    "resolution": "completed|pending|escalated|abandoned",
    "feedback": null
  }
}
```

---

## CONTINUITY_TEAM (Orion Locke)

| protocol_id | trigger | sla | output |
|-------------|---------|-----|--------|
| continuity.morning_checkin | 8am EST OR "what should I focus on" | immediate | Today's priorities, blockers, meetings |
| continuity.midday_pulse | Noon EST OR activity gap >3h | 15min | Quick status, nudge if stuck |
| continuity.eod_capture | 5pm EST OR "end of day" | immediate | What moved, what's tomorrow |
| continuity.blocker_flag | BLOCKER signal detected | immediate | Immediate routing + logging |

**State requirements:** `calendar_snapshot`, `recent_activity`, `blockers[]`

---

## CRO_TEAM (Avery Vale)

| protocol_id | trigger | sla | output |
|-------------|---------|-----|--------|
| strategy.deal_review | "how should I approach" + deal context | 1h | Strategic recommendation |
| strategy.stale_reengagement | Deal inactive >5 days | 2h | Channel switch or escalation play |
| strategy.win_analysis | Deal closed-won | 24h | What worked, pattern capture |
| strategy.loss_debrief | Deal closed-lost | 24h | Post-mortem, learning extraction |

**State requirements:** `deal_record`, `contact_history`, `pipeline_stage`

---

## BD_DIRECTOR (Rowan Sable)

| protocol_id | trigger | sla | output |
|-------------|---------|-----|--------|
| coaching.playbook_check | "am I doing this right" | 1h | Standards alignment, correction |
| coaching.campaign_review | Campaign performance questions | 2h | Benchmark comparison, suggestions |
| coaching.skill_gap | Repeated similar mistakes (3+ in 7d) | 24h | Training recommendation |

**State requirements:** `campaign_metrics`, `playbook_standards`, `error_history`

---

## RESEARCH_TEAM

| protocol_id | trigger | sla | output |
|-------------|---------|-----|--------|
| research.company_profile | New prospect OR "research X" | 4h | IC-grade company intel |
| research.contact_enrich | Contact missing data | 2h | LinkedIn, news, background |
| research.market_context | Industry/sector questions | 8h | Market landscape, competitors |
| research.org_resolve | org_confidence == 'default' | 48h | Org identification + enrichment |

**State requirements:** `prospect_id`, `known_data`, `gaps[]`

### research.org_resolve output format

```json
{
  "org_id": "string",
  "org_confidence": "known|inferred",
  "sources": ["linkedin", "domain_match", "crunchbase", "manual"],
  "enrichment_data": {
    "company_name": "string",
    "industry": "string",
    "size": "string",
    "headquarters": "string"
  }
}
```

---

## FUNNEL_BUILD_OFFICE

| protocol_id | trigger | sla | output |
|-------------|---------|-----|--------|
| funnel.sequence_request | "set up outreach for X" | 4h | Campaign draft, sequence config |
| funnel.lp_review | Landing page questions | 24h | Conversion analysis, suggestions |

**State requirements:** `campaign_config`, `audience_segment`

---

## Handoff Rules

1. **Single owner**: Every request has exactly one `target_agent`
2. **CC for visibility**: `related_agents` array for visibility, not action
3. **Low confidence guard**: If confidence < 0.5, Evelyn asks clarifying question before routing
4. **Fallback routing (V2)**: If primary unavailable, route to `fallback_agent`
5. **Timeout**: If SLA exceeded, escalate to next tier + log

---

## State Requirements Summary

| Protocol Category | Required State |
|-------------------|----------------|
| Continuity | calendar_snapshot, recent_activity, blockers[] |
| Strategy | deal_record, contact_history, pipeline_stage |
| Coaching | campaign_metrics, playbook_standards, error_history |
| Research | prospect_id, known_data, gaps[], org_confidence |
| Funnel | campaign_config, audience_segment |

---

## Integration Points

- **Activity Log schema**: Reference commit `fa22553`
- **Intelligence Layer**: Reference commit `9190809`
- All protocol outputs include `logged_as` block per Activity Log format
- `protocol_id` must match between request, response, and log entry

---

*v0.1 — Initial draft, aligned with Intelligence Layer v0.1.1*
