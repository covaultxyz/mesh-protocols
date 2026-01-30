# Team Hardening Protocol

**Version:** 1.0.0  
**Author:** Protocol Office (via Cassian Sandman)  
**Date:** 2026-01-30  
**Status:** Active

---

## 1. Purpose

Define the repeatable process for taking Virtual Teams and Personas from **draft** to **hardened** state with proper identity, skills wiring, and logging compliance.

**Goal:** Ensure every team/persona in the Virtual Teams DB meets operational standards before being assigned production work.

---

## 2. Hardening Levels

| Level | State | Criteria |
|-------|-------|----------|
| **Draft** | Initial creation | Name and basic info only |
| **Alpha** | Identity defined | All Identity 3.3 fields populated |
| **Beta** | Skills wired | Skills linked, execution tested |
| **Production** | Fully hardened | Logging verified, audit passed |

---

## 3. Hardening Checklist

### Phase 1: Identity (Draft → Alpha)

**Required Fields (Identity 3.3):**
- [ ] `displayName` — Human-readable name
- [ ] `codename` — System identifier (SCREAMING_SNAKE_CASE)
- [ ] `entityType` — PERSONA | TEAM | COMMITTEE
- [ ] `roleTitle` — Official title
- [ ] `seniority` — Partner | Senior | Junior | etc.
- [ ] `domain` — Functional area(s)
- [ ] `primaryJob` — One-sentence mission
- [ ] `programScope` — What they cover
- [ ] `coverage` — Specific areas of responsibility

**Execution Model:**
- [ ] `allowedActions` — What they can do freely
- [ ] `restrictedActions` — What requires approval
- [ ] `decisionRule` — How they decide
- [ ] `escalationTriggers` — When to escalate

**Style:**
- [ ] `toneProfile` — Communication style
- [ ] `riskPosture` — Conservative | Balanced | Aggressive

**Protocol Compliance:**
- [ ] `identityProtocolVersion` — "3.3.0"
- [ ] `lifecycleState` — PILOT | ACTIVE | DEPRECATED
- [ ] `hardeningLevel` — Alpha (after this phase)
- [ ] `maturityStage` — M0 | M1 | M2
- [ ] `status` — Active

**Validation:**
```
All required fields populated?
  YES → Set hardeningLevel = Alpha, proceed to Phase 2
  NO  → Document gaps, remediate, re-check
```

---

### Phase 2: Skills Wiring (Alpha → Beta)

**Skills Linkage:**
- [ ] Identify required skills for role
- [ ] Create/link skill entries in Skills DB
- [ ] Wire skills to persona via `skills` relation
- [ ] Document skill proficiency levels

**Capability Verification:**
- [ ] List concrete actions persona can perform
- [ ] Map actions to skills
- [ ] Verify no capability gaps
- [ ] Test at least one execution scenario

**Interface Definition:**
- [ ] `interfaceContractSummary` — Upstream/downstream dependencies
- [ ] Identify peer personas for collaboration
- [ ] Document handoff patterns

**Validation:**
```
Skills wired and tested?
  YES → Set hardeningLevel = Beta, proceed to Phase 3
  NO  → Document gaps, remediate, re-check
```

---

### Phase 3: Logging & Audit (Beta → Production)

**Logging Compliance:**
- [ ] Verify persona can write to Activity Log
- [ ] Test Activity Log entry creation
- [ ] Confirm log entries include required fields
- [ ] Set up any persona-specific logging patterns

**Metrics Definition:**
- [ ] `primaryMetric` — Main success measure
- [ ] `guardrailMetric` — Failure/risk indicator
- [ ] `metricFamily` — Category (Quality | Reliability | Innovation)
- [ ] `passFailGates` — Activation criteria

**Audit Readiness:**
- [ ] Run Vera Ironwood audit
- [ ] Address any findings
- [ ] Document maturity evidence
- [ ] Update `maturityEvidence` field

**Validation:**
```
Audit passed?
  YES → Set hardeningLevel = Production
  NO  → Document findings, remediate, re-audit
```

---

## 4. Instantiation Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                 TEAM HARDENING WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [CREATE]     [IDENTITY]     [SKILLS]      [AUDIT]             │
│     ↓            ↓              ↓            ↓                 │
│   Draft   →   Alpha    →    Beta    →   Production            │
│                                                                 │
│  • Name       • All 3.3      • Skills      • Logging          │
│  • Codename     fields         wired        verified          │
│               • Execution    • Interface   • Audit            │
│                 model          defined       passed           │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Reference: Oracle Instantiation (2026-01-30)

**Case Study:** First cross-org persona instantiation via mesh coordination.

### Process Used:
1. **Request:** Ely requested Identity 3.3 protocol run
2. **Spec Gathering:** Sandman requested identity spec from Oracle
3. **Data Collection:** Oracle provided full spec via Telegram
4. **Entry Creation:** Sandman created Virtual Teams DB entry
5. **Audit:** Vera Ironwood ran compliance audit
6. **Outcome:** 🟢 PASS — Oracle at Beta hardening

### Lessons Learned:
- Collaborative spec gathering works across mesh
- Multi-agent coordination enables faster instantiation
- Audit immediately after creation catches gaps early

---

## 6. Automation Opportunities

### Currently Manual:
- Field population (requires spec from source)
- Skills identification
- Interface mapping

### Automatable:
- Field validation (check completeness)
- Audit execution (Vera Ironwood)
- Log entry creation
- Status updates

### Future Enhancement:
- Template-based creation for common persona types
- Auto-suggest skills based on role/domain
- Batch hardening for similar personas

---

## 7. Error Handling

| Issue | Resolution |
|-------|------------|
| Missing required field | Flag in audit, block promotion to next level |
| Skills DB entry missing | Create skill entry first, then wire |
| Audit failure | Document findings, assign remediation owner |
| Logging test fails | Check API access, token permissions |

---

## 8. Roles & Responsibilities

| Role | Responsibility |
|------|----------------|
| **Requestor** | Initiate hardening, provide initial spec |
| **Identity Architecture Office** | Validate identity fields, run audits |
| **Protocol Office** | Ensure protocol compliance |
| **Skills Owner** | Create/maintain skill entries |
| **Persona Owner** | Remediate gaps, maintain ongoing compliance |

---

## 9. Metrics

Track hardening effectiveness:
- Time from Draft → Production (target: <24h for simple, <72h for complex)
- First-pass audit success rate
- Remediation cycle count
- Active vs. Draft ratio in VT DB

---

## 10. Quick Reference

```
┌─────────────────────────────────────────────────┐
│         HARDENING CHEAT SHEET                  │
├─────────────────────────────────────────────────┤
│ Draft → Alpha:  Fill all Identity 3.3 fields   │
│ Alpha → Beta:   Wire skills, test execution    │
│ Beta → Prod:    Pass Vera audit, verify logs   │
│                                                │
│ Required for Alpha:                            │
│   displayName, codename, entityType,           │
│   roleTitle, primaryJob, allowedActions,       │
│   restrictedActions, decisionRule              │
│                                                │
│ Required for Production:                       │
│   Audit pass + logging verified                │
└─────────────────────────────────────────────────┘
```

---

*Created by Protocol Office — OVP Task 2 — 2026-01-30*
