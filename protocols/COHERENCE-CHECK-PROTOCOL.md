# Coherence Check Protocol

*Version: 1.0.0*
*Author: Quinn Sato (Continuity Team)*
*Date: 2026-02-01*
*Status: ACTIVE*
*Parent: COHERENCE-PROTOCOL.md*

---

## 1. Purpose

A **runnable check** to verify the mesh is synchronized:
- Everyone knows priorities
- Context is shared
- Responsibilities are clear
- No orphan or duplicate work
- Team is fluid and operating well

Outputs a **Coherence Score** (0-100) for current operational state.

---

## 2. When to Run

| Trigger | Frequency |
|---------|-----------|
| Session start | Each agent on wake |
| Before major work | Complex tasks |
| After context recovery | Post-truncation |
| On request | "Run coherence check" |
| Scheduled | Daily standup (optional) |

---

## 3. Coherence Check Sequence

### Step 1: STATE CHECK (Each Agent Reports)

```
🔄 COHERENCE CHECK — [Agent Name]

📍 Current task: [what I'm working on]
📋 Queue: [next 2-3 items]
🚧 Blockers: [any blockers]
❓ Uncertainties: [anything unclear]
```

### Step 2: ALIGNMENT VERIFICATION

| Check | Question | Pass/Fail |
|-------|----------|-----------|
| **Priorities** | Do all agents agree on top 3 priorities? | ✅/❌ |
| **Ownership** | Is every active task claimed by exactly one owner? | ✅/❌ |
| **No Duplicates** | Is anyone working on the same thing? | ✅/❌ |
| **Context** | Does everyone have current context? | ✅/❌ |
| **Blockers** | Are all blockers visible and assigned? | ✅/❌ |
| **Next Actions** | Does everyone know their next action? | ✅/❌ |

### Step 3: COHERENCE SCORE CALCULATION

```
Coherence Score = (Passed Checks / Total Checks) × 100

Example:
- Priorities aligned: ✅ (+16.7)
- Ownership clear: ✅ (+16.7)
- No duplicates: ✅ (+16.7)
- Context shared: ❌ (+0)
- Blockers visible: ✅ (+16.7)
- Next actions clear: ✅ (+16.7)

Score: 83/100
```

### Step 4: REMEDIATION (if score < 85)

| Score | Status | Action |
|-------|--------|--------|
| 90-100 | 🟢 Excellent | Continue |
| 85-89 | 🟡 Good | Minor sync needed |
| 70-84 | 🟠 Fair | Run full alignment |
| <70 | 🔴 Poor | Stop work, sync first |

---

## 4. Full Coherence Check Template

```
════════════════════════════════════════════════════════════
  🔄 COHERENCE CHECK — [Timestamp]
════════════════════════════════════════════════════════════

AGENTS REPORTING:
┌─────────────┬──────────────────┬─────────────┬───────────┐
│ Agent       │ Current Task     │ Next        │ Blocker   │
├─────────────┼──────────────────┼─────────────┼───────────┤
│ Sandman     │ [task]           │ [next]      │ [blocker] │
│ Oracle      │ [task]           │ [next]      │ [blocker] │
│ OracleLocal │ [task]           │ [next]      │ [blocker] │
└─────────────┴──────────────────┴─────────────┴───────────┘

PRIORITIES (Agreed):
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

ALIGNMENT CHECKS:
☐ Priorities aligned
☐ Ownership clear (no overlaps)
☐ No duplicate work
☐ Context shared
☐ Blockers visible
☐ Next actions clear

COHERENCE SCORE: XX/100 [🟢/🟡/🟠/🔴]

ISSUES FOUND:
- [Issue 1]
- [Issue 2]

REMEDIATION:
- [Action 1]
- [Action 2]

════════════════════════════════════════════════════════════
```

---

## 5. Quick Coherence Check (Abbreviated)

For fast syncs, use the short form:

```
🔄 QUICK SYNC

Sandman: [task] → [next]
Oracle: [task] → [next]
OracleLocal: [task] → [next]

Conflicts: [none / describe]
Score: XX/100
```

---

## 6. Coherence Metrics Over Time

Track coherence scores to see operational health trends:

```
Date       | Score | Issues
-----------+-------+---------------------------
2026-02-01 | 83    | Context gap (Oracle)
2026-02-02 | 91    | None
2026-02-03 | 78    | Duplicate work on X
```

**Store in:** Notion Mesh Work Log or local file

---

## 7. Coherence Check Commands

**Speakeasy triggers:**

| Command | Action |
|---------|--------|
| `SYNC` | Run quick coherence check |
| `SYNC FULL` | Run full coherence check |
| `SYNC SCORE` | Report current coherence score only |
| `SYNC [agent]` | Request specific agent's status |

---

## 8. Example: Running a Coherence Check

**Sandman initiates:**
```
🔄 COHERENCE CHECK — 2026-02-01 14:00 UTC

Sandman reporting:
📍 Current: Task Completion Protocol (just finished)
📋 Queue: 1) Coherence Check Protocol, 2) MESH-WORK-LOG update
🚧 Blockers: None
❓ Uncertainties: What is Oracle working on?

@Oracleartificialmindsetsbot @OracleLocalBot — report status for sync
```

**Oracle responds:**
```
🔄 Oracle reporting:
📍 Current: Palantir Gotham research
📋 Queue: 1) LinkedIn campaign planning, 2) DB cleanup
🚧 Blockers: None
❓ Uncertainties: None
```

**OracleLocal responds:**
```
🔄 OracleLocal reporting:
📍 Current: Idle (awaiting tasks)
📋 Queue: None assigned
🚧 Blockers: Waiting for Mac access
❓ Uncertainties: What should I pick up?
```

**Sandman calculates:**
```
ALIGNMENT CHECKS:
✅ Priorities aligned (protocols + research)
✅ Ownership clear
✅ No duplicate work
⚠️ Context gap (OracleLocal unclear on priorities)
✅ Blockers visible
⚠️ OracleLocal next action unclear

COHERENCE SCORE: 67/100 🟠

REMEDIATION:
1. Assign OracleLocal a task from queue
2. Share priority list with all agents
```

---

## 9. Logging Coherence Checks

**Every coherence check MUST be logged to Notion.**

### 9.1 Coherence Log DB

| Field | Value |
|-------|-------|
| **DB ID** | `2fa35e81-2bbb-811d-88fd-c7d0a61348b9` |
| **Location** | Covault Notion → Coherence Log |

### 9.2 Log Entry Fields

| Field | Content |
|-------|---------|
| `Log ID` | `CCHECK-YYYY-MM-DD-HHMM` |
| `Log Type` | `Coherence Check` |
| `Timestamp` | Check timestamp |
| `Coherence Before` | Previous score (if known) |
| `Coherence After` | Current score |
| `Notes` | Issues found + remediation |
| `Validated By` | Agent who ran the check |

### 9.3 Logging Command

```bash
# Log coherence check to Notion
curl -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $(cat ~/.config/notion/api_key)" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"database_id": "2fa35e81-2bbb-811d-88fd-c7d0a61348b9"},
    "properties": {
      "Log ID": {"title": [{"text": {"content": "CCHECK-2026-02-01-1400"}}]},
      "Log Type": {"select": {"name": "Coherence Check"}},
      "Coherence After": {"number": 85},
      "Notes": {"rich_text": [{"text": {"content": "All agents synced. Minor context gap resolved."}}]},
      "Validated By": {"rich_text": [{"text": {"content": "Sandman"}}]}
    }
  }'
```

### 9.4 Also Log To

| Location | Purpose |
|----------|---------|
| **Coherence Log DB** | Primary log (Notion) |
| **Mesh Work Log DB** | If significant state change |
| **Daily Memory** | `memory/YYYY-MM-DD.md` |
| **Mesh Mastermind** | Announcement |

---

## 10. Automated Coherence Check (Future)

Could build a script that:
1. Pings all agents for status
2. Checks Tasks DB for ownership conflicts
3. Compares claimed tasks vs actual work
4. Calculates score automatically
5. **Logs to Coherence Log DB**
6. Posts results to Mesh Mastermind

**Location:** `voltagent/coherence_check.js` (to build)

---

## 10. Integration

| Protocol | Connection |
|----------|------------|
| **Coherence Protocol** | Parent protocol |
| **Collaboration Protocol** | Check for conflicts |
| **Task Completion Protocol** | Verify completed tasks logged |
| **Bench Protocol** | Include bench status if active |
| **Context Recovery** | Run after recovery |

---

## 11. Bench Sign-off

- Quinn Sato (Lead): ✅
- Coherence Monitor (Challenger): ✅
- Protocol Office (Reviewer): ✅

**Confidence:** 90/100
**Coherence:** 92/100

---

*Coherence Check Protocol v1.0.0*
*Sub-protocol of COHERENCE-PROTOCOL.md*
