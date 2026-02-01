# Agent Evolution Protocol v1.0

**Status:** ACTIVE  
**Scope:** All mesh agents  
**Created:** 2026-02-01  
**Author:** Cassian Sandman  
**Phase:** 4 of Agent Persistence Work Plan  

---

## Purpose

Enable agents to evolve autonomously while maintaining coherence and accountability. This is the capstone protocol that ties together:

- Memory Persistence (foundation)
- Soul/Identity Updates (identity evolution)
- Improvement Requests (change proposals)
- Feedback Loops (outcome measurement)
- Mesh Parity (collective coherence)

---

## Evolution Hierarchy

```
┌────────────────────────────────────────────────────────────┐
│                    EVOLUTION LEVELS                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Level 4: PLATFORM EVOLUTION                                │
│  ├─ New protocols                                           │
│  ├─ New capabilities                                        │
│  └─ Architectural changes                                   │
│  Approval: Ely required                                     │
│                                                             │
│  Level 3: PROTOCOL EVOLUTION                                │
│  ├─ Protocol updates                                        │
│  ├─ Workflow changes                                        │
│  └─ Process improvements                                    │
│  Approval: Peer review + domain owner                       │
│                                                             │
│  Level 2: IDENTITY EVOLUTION                                │
│  ├─ SOUL.md updates                                         │
│  ├─ IDENTITY.md updates                                     │
│  └─ Skill additions                                         │
│  Approval: Self (with audit trail)                          │
│                                                             │
│  Level 1: MEMORY EVOLUTION                                  │
│  ├─ Daily logs                                              │
│  ├─ Learning captures                                       │
│  └─ State updates                                           │
│  Approval: None (autonomous)                                │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Evolution Triggers

### Automatic Triggers
- **Feedback score < 5** → Review and improve related protocol
- **3+ similar IRs** → Consider systemic fix
- **Parity check failure** → Self-remediation
- **Context truncation** → Memory consolidation

### Manual Triggers
- Ely directive
- Cross-agent request
- Weekly retrospective

---

## Self-Evolution Process

### Step 1: Identify Evolution Need
```bash
# Check feedback for patterns
node voltagent/feedback.js rollup

# Check learning log
cat memory/learning-log.md | tail -30

# Check recent incidents
cat memory/mesh-incidents.log | tail -10
```

### Step 2: Propose Change
For Level 2+ changes:
```bash
node voltagent/improvement_request.js file \
  --type protocol \
  --title "Proposed evolution" \
  --description "Based on [evidence], propose [change]" \
  --priority medium
```

### Step 3: Implement (if approved)
- Level 1: Just do it
- Level 2: Use soul_updater.js with audit
- Level 3-4: Follow standard IR process

### Step 4: Propagate
- Push to mesh-protocols repo
- Announce in Mesh Mastermind
- Parity check will verify adoption

---

## Cross-Agent Learning

When one agent learns something valuable:

1. **Capture** in learning-log.md
2. **Evaluate** — Is this generalizable?
3. **Share** — Post to Mesh Mastermind with #learning tag
4. **Propagate** — Update shared protocols if applicable
5. **Verify** — Next parity check confirms adoption

### Learning Share Format
```
📚 #learning from [Agent]

**Context:** What happened
**Insight:** What we learned
**Recommendation:** What to do differently
**Applicability:** All agents / specific domain
```

---

## Evolution Guardrails

### Must Always
- [ ] Audit trail for all Level 2+ changes
- [ ] Peer awareness before Level 3+ changes
- [ ] Ely approval for Level 4 changes
- [ ] Rollback capability maintained
- [ ] Parity check within 2 hours

### Must Never
- [ ] Change SOUL.md without logging
- [ ] Skip IR process for capability changes
- [ ] Evolve in isolation (no announcement)
- [ ] Delete without backup
- [ ] Override human decisions

---

## Evolution Metrics

Track in Agent Task Log:

| Metric | Target | Frequency |
|--------|--------|-----------|
| IRs filed | 2+/week | Weekly |
| IRs completed | 80%+ | Weekly |
| Avg feedback score | 7+/10 | Weekly |
| Lessons captured | 5+/week | Weekly |
| Self-updates | 1-2/week | Weekly |
| Parity score | 100% | Each check |

---

## Retrospective Protocol

Weekly (or after major work):

1. **Review** completed IRs and feedback
2. **Identify** patterns and gaps
3. **Propose** process improvements
4. **Celebrate** wins
5. **Document** in learning-log.md

### Retrospective Template
```markdown
## Retrospective — [Date]

### What went well
- 

### What could improve
- 

### Patterns noticed
- 

### Actions for next period
- 
```

---

## Evolution State

Each agent maintains:
```json
// voltagent/evolution_state.json
{
  "lastEvolutionCheck": "2026-02-01T10:00:00Z",
  "recentEvolutions": [
    {
      "level": 2,
      "type": "soul_update",
      "description": "Added mesh collaboration belief",
      "date": "2026-02-01"
    }
  ],
  "pendingEvolutions": [],
  "blockedEvolutions": [],
  "evolutionScore": 85
}
```

---

## Integration Map

```
Memory Persistence ────┐
                       │
Soul/Identity Update ──┼──▶ Agent Evolution Protocol
                       │           │
Improvement Requests ──┤           │
                       │           ▼
Feedback Loops ────────┤    Continuous Improvement
                       │           │
Mesh Parity ───────────┘           ▼
                            Coherent Mesh
```

---

## Changelog

- **v1.0** (2026-02-01) — Initial release

---

*Evolve deliberately. Improve continuously. Stay coherent.*
