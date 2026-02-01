# Coherence Protocol

*Version: 1.0.0*
*Author: Quinn Sato (Continuity Team) + Vera Ironwood (Identity Office)*
*Date: 2026-02-01*
*Status: ACTIVE*

---

## 1. Purpose

The Coherence Protocol ensures all mesh agents and virtual teams maintain **alignment** across:
- **Context** — What we know and remember
- **State** — Current work and commitments
- **Identity** — Who we are and how we behave
- **Collaboration** — How we work together
- **Execution** — Plans vs actual outcomes

**Goal:** The mesh operates as a coherent whole, not fragmented individuals.

---

## 2. Coherence Domains

```
                    ┌─────────────────────┐
                    │  COHERENCE PROTOCOL │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   CONTEXT     │    │    STATE      │    │   IDENTITY    │
│  (Memory)     │    │  (Work)       │    │  (Behavior)   │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ COLLABORATION │    │  EXECUTION    │    │  EVOLUTION    │
│ (Multi-agent) │    │ (Outcomes)    │    │ (Growth)      │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## 3. Context Coherence

**Problem:** Agents wake up fresh each session. Context gets truncated.

**Solution:** Persistent memory system + recovery protocol.

### 3.1 Components
- **CONTEXT-RECOVERY-PROTOCOL.md** — What to do when truncated
- **Daily memory files** — `memory/YYYY-MM-DD.md`
- **Long-term memory** — `MEMORY.md`
- **State snapshot** — `MESH-WORK-LOG.md`
- **Session tracking** — `heartbeat-state.json`

### 3.2 Coherence Checks
| Check | Frequency | Action if Failed |
|-------|-----------|------------------|
| Daily memory exists | Each session | Create it |
| MESH-WORK-LOG.md current | Each session | Update it |
| heartbeat-state.json fresh | Each heartbeat | Update it |
| MEMORY.md reviewed | Weekly | Curate it |

### 3.3 Reference
→ `protocols/CONTEXT-RECOVERY-PROTOCOL.md`

---

## 4. State Coherence

**Problem:** Work state drifts. Tasks get lost. Commitments forgotten.

**Solution:** Single source of truth + regular sync.

### 4.1 Components
- **Tasks DB** — `2f835e81-2bbb-81b6-9700-e18108a40b1f` (canonical)
- **Mesh Work Log DB** — `2f935e81-2bbb-810e-8bc0-eed9cfdf3c19`
- **Work Plans** — Notion pages with checkboxes
- **VoltAgent state files** — Local task tracking

### 4.2 Coherence Checks
| Check | Frequency | Action if Failed |
|-------|-----------|------------------|
| Task assignments in DB | Each task claim | Add to DB |
| Work plan progress tracked | Daily | Update checkboxes |
| Completed tasks archived | On completion | Move to done |
| No duplicate claims | Before claiming | Check DB first |

### 4.3 State Sync Protocol
```
1. Before starting work → Check Tasks DB
2. When claiming → Update claimed_by, claimed_at
3. When completing → Update status, log output
4. When blocked → Update status, notify mesh
```

---

## 5. Identity Coherence

**Problem:** Agents/personas drift from their specs. Behavior doesn't match identity.

**Solution:** Identity specs + behavioral audits.

### 5.1 Components
- **Virtual Teams DB** — `2f735e81-2bbb-81eb-903a-d3c9edd8331a`
- **SOUL.md / IDENTITY.md** — Agent identity files
- **Persona specs** — roleTitle, primaryJob, allowedActions, restrictedActions
- **Identity Protocol 3.3** — Governance standard

### 5.2 Coherence Checks
| Check | Frequency | Action if Failed |
|-------|-----------|------------------|
| Behavior matches roleTitle | Ongoing | Correct or update spec |
| Actions within allowedActions | Each action | Stop if outside scope |
| No restrictedActions violated | Each action | Escalate if violated |
| Identity files current | Monthly | Audit and update |

### 5.3 Identity Drift Signals
- Doing work outside your domain
- Responding in ways that don't match persona
- Forgetting role constraints
- Acting without consulting specs

### 5.4 Reference
→ Vera Ironwood (Identity Architecture Office)
→ `protocols/IDENTITY-AUDIT-PROTOCOL.md` (if exists)

---

## 6. Collaboration Coherence

**Problem:** Multiple agents work in parallel without coordination. Duplication. Conflicts.

**Solution:** Collaboration protocol + claim system + bench protocol.

### 6.1 Components
- **BOT-COLLABORATION-PROTOCOL.md** — Routing and claims
- **BENCH-PROTOCOL.md** — Virtual team committees
- **SPEAKEASY-LEXICON.md** — Shared vocabulary
- **Domain registry** — Who owns what

### 6.2 Coherence Checks
| Check | Frequency | Action if Failed |
|-------|-----------|------------------|
| Task claimed before starting | Each task | Claim first |
| Domain respected | Each task | Route to owner |
| Bench loaded for complex tasks | Complex tasks | Load bench |
| No parallel duplicate work | Ongoing | Check mesh first |

### 6.3 Collaboration Sync Protocol
```
1. Task arrives → Check domain registry
2. If my domain → Claim in mesh + DB
3. If not my domain → Route to owner
4. If complex → BENCH the appropriate team
5. If uncertain → PING Quinn Sato for routing
```

### 6.4 Reference
→ `protocols/BOT-COLLABORATION-PROTOCOL.md`
→ `protocols/BENCH-PROTOCOL.md`

---

## 7. Execution Coherence

**Problem:** Plans exist but don't get executed. Outcomes don't match intentions.

**Solution:** Work plans + progress tracking + outcome logging.

### 7.1 Components
- **Work Plans** — Notion pages with phases and checkboxes
- **Quality Gates** — Confidence/Coherence scoring
- **Outcome logs** — What actually happened
- **Retrospectives** — What worked, what didn't

### 7.2 Coherence Checks
| Check | Frequency | Action if Failed |
|-------|-----------|------------------|
| Work plan exists for project | Before starting | Create plan |
| Progress tracked in checkboxes | During work | Update checkboxes |
| Quality gate scores logged | On completion | Add scores |
| Outcomes match intentions | On completion | Log variance |

### 7.3 Execution Quality Gate
Every deliverable must include:
```
📊 Quality Gate
├─ Confidence: XX/100 — How sure am I this is right?
├─ Coherence: XX/100 — How well does this fit the system?
└─ Status: ✅ PASS (both ≥85) | ⚠️ REVIEW (either <85)
```

---

## 8. Evolution Coherence

**Problem:** System evolves but changes aren't coordinated. Protocols conflict. Identities drift.

**Solution:** Change management + version tracking + cross-agent sync.

### 8.1 Components
- **Protocol versioning** — Version numbers in all protocols
- **Git history** — Change tracking
- **Mesh announcements** — Changes broadcast to all
- **Activity Log** — Notion logging

### 8.2 Coherence Checks
| Check | Frequency | Action if Failed |
|-------|-----------|------------------|
| Protocol changes announced | Each change | Announce in mesh |
| All agents have latest protocols | Weekly | Git pull + sync |
| Identity changes logged | Each change | Update Activity Log |
| No conflicting protocols | On creation | Review existing |

### 8.3 Evolution Protocol
```
1. Propose change → Draft in protocols/
2. Review → Bench reviews (Protocol Office)
3. Approve → Ely or Protocol Office sign-off
4. Deploy → Push to GitHub
5. Announce → Notify mesh
6. Verify → All agents confirm receipt
```

---

## 9. Coherence Dashboard (Conceptual)

```
┌─────────────────────────────────────────────────────────────┐
│                   COHERENCE DASHBOARD                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CONTEXT        STATE          IDENTITY      COLLABORATION  │
│  ████████░░     ██████████     ████████░░    ██████░░░░     │
│  80%            100%           85%           65%            │
│                                                             │
│  Issues:                                                    │
│  ⚠️ MEMORY.md not curated in 7 days                        │
│  ⚠️ 3 tasks claimed without DB entry                       │
│  ⚠️ Oracle hasn't synced HEARTBEAT.md                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Coherence Roles

| Role | Responsibility |
|------|----------------|
| **Quinn Sato** | Cross-team coherence, state tracking, routing |
| **Vera Ironwood** | Identity coherence, persona specs |
| **Coherence Monitor** | Drift detection, variance flagging |
| **Carlos (Protocol Office)** | Protocol coherence, standards |
| **Each Agent** | Self-coherence, file maintenance |

---

## 11. Daily Coherence Checklist

Each agent, each day:

```
☐ Daily memory file exists and updated
☐ MESH-WORK-LOG.md reflects current state
☐ heartbeat-state.json current
☐ No unclaimed tasks in progress
☐ Bench loaded for complex tasks
☐ Collaboration mode in group chats
☐ No work outside my domain without routing
```

---

## 12. Coherence Failure Escalation

| Level | Trigger | Action |
|-------|---------|--------|
| **L0** | Self-detected drift | Self-correct |
| **L1** | Cross-agent inconsistency | Sync in mesh |
| **L2** | Protocol conflict | Protocol Office review |
| **L3** | Systemic coherence failure | Ely escalation |

---

## 13. Bench Sign-off

- Quinn Sato (Lead): ✅
- Coherence Monitor (Challenger): ✅
- Vera Ironwood (Specialist): ✅
- Carlos / Protocol Office (Reviewer): ✅

**Confidence:** 92/100
**Coherence:** 94/100

---

*Coherence Protocol v1.0.0*
*Continuity Team + Identity Office*
