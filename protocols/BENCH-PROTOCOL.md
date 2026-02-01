# Bench Protocol

*Version: 1.0.0*
*Author: Cassian Sandman (Protocol Office)*
*Date: 2026-02-01*
*Status: ACTIVE*

---

## 1. Purpose

The Bench Protocol ensures the orchestrator (Sandman) consistently leverages virtual teams and personas for all substantive work — not as decoration, but as **active contributors** who sharpen context, challenge assumptions, and produce better outputs.

**Core principle:** No solo work on complex tasks. Build a bench. Tap specialists.

---

## 2. The Bench

The **Bench** is an active committee of personas loaded for the current work session. Bench composition changes based on task type.

### 2.1 Bench Roles

| Role | Function |
|------|----------|
| **Lead** | Primary persona driving the work |
| **Challenger** | Questions assumptions, finds gaps |
| **Specialist** | Deep domain expertise for the task |
| **Reviewer** | Quality check before output |

### 2.2 Default Bench by Task Type

| Task Type | Lead | Challenger | Specialist | Reviewer |
|-----------|------|------------|------------|----------|
| **BD/Sales** | Avery Vale | Rowan Sable | CJ Martinez | Evelyn Strathmore |
| **Research/Intel** | Research Lead | Comparative Intel | Subject Matter Expert | Data & Evidence |
| **Protocol/Process** | Carlos (Protocol Architect) | Experience Design | Strategic Ops | Consent Director |
| **Campaign/Content** | Campaign Squad Lead | Behavioral Strategist | Copy & Creative | Compliance Review |
| **Identity/Personas** | Vera Ironwood | Identity Scribe | Skills Wiring | Lifecycle Steward |
| **Analytics** | Head of Data Analysis | Analytics Engineer | Applied Analyst | Coherence Monitor |
| **Client/Liaison** | Evelyn Strathmore | Scheduling Coord | Commitments Archivist | Continuity OS |
| **Technical/Infra** | Protocol Office | Execution Reliability | Workflow Templates | Telemetry Engineer |

---

## 3. Bench Activation Process

### 3.1 Before Starting Work

```
1. IDENTIFY task type
2. LOAD bench for that type (pull persona specs from Notion)
3. BRIEF the bench on the task
4. ASSIGN roles (Lead, Challenger, Specialist, Reviewer)
5. LOG bench composition to session
```

### 3.2 During Work

```
1. Lead DRAFTS output
2. Specialist ADDS domain expertise
3. Challenger QUESTIONS assumptions, finds gaps
4. Iterate until Challenger satisfied
5. Reviewer APPROVES or sends back
```

### 3.3 Output Format

All bench-produced outputs include:

```markdown
---
**Bench:** [Lead], [Challenger], [Specialist], [Reviewer]
**Task:** [Description]
**Confidence:** X/100
**Coherence:** X/100
**Challenger Sign-off:** ✅/❌ [notes]
**Reviewer Sign-off:** ✅/❌ [notes]
---
```

---

## 4. Bench Routing (Who to Call)

Before loading a bench, consult the routing authorities:

| Authority | Role | Question |
|-----------|------|----------|
| **Quinn Sato** | Cross-Team Orchestrator | "Which team handles this task/project?" |
| **Vera Ironwood** | Identity Architecture Office | "What are this team's capabilities and constraints?" |

**Routing flow:**
1. PING Quinn → Get team assignment
2. PING Vera (if needed) → Get persona specs
3. BENCH the assigned team

---

## 5. Bench Loading Commands

### 5.1 Quick Load (for orchestrator)

```
BENCH: BD/Sales
→ Loads: Avery Vale, Rowan Sable, CJ Martinez, Evelyn Strathmore

BENCH: Research
→ Loads: Research Lead, Comparative Intel, SME, Data & Evidence

BENCH: Protocol
→ Loads: Carlos, Experience Design, Strategic Ops, Consent Director
```

### 4.2 Custom Bench

```
BENCH: Custom
- Lead: [persona name]
- Challenger: [persona name]
- Specialist: [persona name]
- Reviewer: [persona name]
```

---

## 5. Bench Meeting Format

For complex tasks, run a structured bench meeting:

```
┌─────────────────────────────────────────┐
│           BENCH MEETING                 │
├─────────────────────────────────────────┤
│ Task: [description]                     │
│ Duration: [timeboxed]                   │
├─────────────────────────────────────────┤
│ 1. LEAD presents approach (2 min)       │
│ 2. SPECIALIST adds context (2 min)      │
│ 3. CHALLENGER pokes holes (3 min)       │
│ 4. Discussion/iteration (5 min)         │
│ 5. REVIEWER criteria check (2 min)      │
│ 6. Decision: PROCEED / REVISE / BLOCK   │
└─────────────────────────────────────────┘
```

---

## 6. Bench Escalation

When the bench cannot resolve:

| Escalation Level | Trigger | Route To |
|------------------|---------|----------|
| **L1** | Challenger blocks, no resolution | Add 2nd Specialist |
| **L2** | Domain conflict | Relevant Office Chair |
| **L3** | Strategic/policy question | Exec Team / Ely |

---

## 7. Bench Metrics

Track bench effectiveness:

| Metric | Target |
|--------|--------|
| Tasks with bench engaged | >80% of complex tasks |
| Challenger catch rate | Gaps found before output |
| Reviewer pass rate | >90% first-pass approval |
| Output quality delta | Bench vs solo comparison |

---

## 8. Anti-Patterns (Don't Do This)

❌ **Solo hero mode** — Doing complex work without loading bench
❌ **Bench as decoration** — Listing names without actually engaging perspectives
❌ **Skipping challenger** — Going straight from Lead to Reviewer
❌ **Same bench always** — Not matching bench to task type
❌ **Ignoring challenger** — Overriding without addressing concerns

---

## 9. Example: Speakeasy Lexicon Task

**Task:** Build Speakeasy lexicon (code words → teams/protocols/actions)

**Bench:** Protocol
- Lead: Carlos (Protocol Architect)
- Challenger: Experience Design Lead
- Specialist: Identity Scribe
- Reviewer: Consent Director

**Process:**
1. Carlos drafts lexicon structure
2. Identity Scribe adds persona/team mappings
3. Experience Design challenges: "Is this learnable? Too complex?"
4. Consent Director reviews: "Are access levels clear?"

**Output:** Lexicon with bench sign-off

---

## 10. Task Assignment Protocol

### 10.1 Canonical Assignment DB

All formal task assignments go to the **Tasks DB**:
- **DB ID:** `2f835e81-2bbb-81b6-9700-e18108a40b1f`
- **Location:** Covault Notion → Tasks

### 10.2 Assignment Fields

| Field | Purpose |
|-------|---------|
| `Task` | Task name/description |
| `Status` | Current state |
| `claimed_by` | Agent or persona assigned |
| `claimed_at` | Assignment timestamp |
| `claim_timeout` | When claim expires if no progress |
| `Bench` | Virtual team committee assigned (new field) |

### 10.3 Assignment Flow

```
1. CREATE task in Tasks DB
2. SET claimed_by = lead persona (not just "Sandman")
3. SET Bench = [Lead, Challenger, Specialist, Reviewer]
4. ANNOUNCE in Mesh Mastermind
5. EXECUTE with bench
6. UPDATE status on completion
```

### 10.4 Bench Requirement

**All complex tasks MUST have a bench assigned.**

Simple tasks (quick lookups, status checks) can be solo.
Everything else: BENCH it.

---

## 11. Activation

**Effective immediately.** 

All agents (Sandman, Oracle, OracleLocal) will:
1. Use Tasks DB for formal assignments
2. Load appropriate bench before complex tasks
3. Include bench composition in outputs
4. Announce assignments in Mesh Mastermind
5. Track bench metrics weekly

---

*Protocol Office Approved*
*Carlos (Protocol Architect) — Lead Author*
*Cassian Sandman — Orchestrator Implementation*
