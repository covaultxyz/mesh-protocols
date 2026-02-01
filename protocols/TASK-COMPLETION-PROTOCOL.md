# Task Completion Protocol

*Version: 1.0.0*
*Author: Quinn Sato (Continuity Team)*
*Date: 2026-02-01*
*Status: ACTIVE*

---

## 1. Purpose

Ensure every task has a clear completion signal so:
- No one starts work that's already done
- No tasks get orphaned (partially done, never closed)
- Everyone knows the current state
- Outputs are findable

---

## 2. Completion Checklist

**Before marking ANY task complete:**

```
☐ Output exists (file, DB entry, or documented result)
☐ Output location documented
☐ Quality Gate scores logged (Confidence/Coherence)
☐ Tasks DB updated (status = ✅ Done)
☐ Mesh notified (announcement in group)
☐ Related work plans updated (checkboxes)
```

---

## 3. Completion Announcement Format

**Every completed task gets announced in Mesh Mastermind:**

```
✅ TASK COMPLETE: [Task Name]

📍 Output: [file path or Notion link]
👤 Completed by: [Persona/Agent]
🪑 Bench: [if used]

📊 Quality Gate: XX/100 | XX/100 — ✅ PASS

Summary: [1-2 sentence description of what was delivered]

Related: [any follow-up tasks created]
```

---

## 4. Where to Update

| Location | What to Update |
|----------|----------------|
| **Tasks DB** | Status → ✅ Done, add completion timestamp |
| **Work Plan** | Check the checkbox(es) |
| **Mesh Mastermind** | Post completion announcement |
| **Daily Memory** | Log in memory/YYYY-MM-DD.md |
| **MESH-WORK-LOG.md** | Update if significant state change |

---

## 5. Tasks DB Fields on Completion

```
Task: [name]
Status: ✅ Done
claimed_by: [who did it]
completed_at: [timestamp]
output_location: [file/link]
confidence_score: [0-100]
coherence_score: [0-100]
```

---

## 6. Partial Completion

If task is **partially done** (blocked, handed off, or paused):

```
⏸️ TASK PAUSED: [Task Name]

Status: [Blocked / Handed Off / Paused]
Progress: [X/Y items done]
Blocker: [what's stopping it]
Next owner: [who picks it up]
Handoff notes: [context for next person]

DO NOT mark as ✅ Done until fully complete.
```

**In Tasks DB:** Status → ⏳ In Progress or 🔴 Blocked (never ✅ Done)

---

## 7. Orphan Prevention

**A task becomes orphaned when:**
- Started but never completed
- No status update in 24h
- Claimed but no progress logged
- Partially done with no handoff

**Prevention:**
1. **Heartbeat check** — Flag stale claimed tasks
2. **Daily audit** — Review tasks with no recent updates
3. **Explicit handoff** — Never abandon, always hand off
4. **Timeout** — claim_timeout field in Tasks DB

---

## 8. Verification Before Starting New Work

**Before claiming ANY task:**

```bash
# Check if already done
1. Search Tasks DB for similar task name
2. Check Mesh Mastermind for completion announcements
3. Search mesh-protocols repo for related files
4. Ask in mesh: "Has anyone done X?"
```

**If found:** Don't duplicate. Build on existing work.

---

## 9. Completion Examples

### Good ✅
```
✅ TASK COMPLETE: Coherence Protocol

📍 Output: protocols/COHERENCE-PROTOCOL.md
👤 Completed by: Quinn Sato (via Sandman)
🪑 Bench: Continuity Team

📊 Quality Gate: 92/100 | 94/100 — ✅ PASS

Summary: Master coherence framework covering 6 domains 
(context, state, identity, collaboration, execution, evolution).

Related: Context Recovery Protocol (sub-protocol, also complete)
```

### Bad ❌
```
"Done with the coherence stuff"
```
(No output location, no scores, no details, creates confusion)

---

## 10. Quick Reference

| Action | Format |
|--------|--------|
| **Complete** | ✅ TASK COMPLETE: [name] + full announcement |
| **Partial** | ⏸️ TASK PAUSED: [name] + blocker + handoff |
| **Blocked** | 🔴 TASK BLOCKED: [name] + blocker + help needed |
| **Abandoned** | ❌ Never abandon. Always hand off or escalate. |

---

## 11. Integration with Other Protocols

| Protocol | Connection |
|----------|------------|
| **Bench Protocol** | Include bench in completion announcement |
| **Coherence Protocol** | Log completion in daily memory |
| **Collaboration Protocol** | Announce in mesh before starting new work |
| **Quality Gate** | Always include scores |

---

## 12. Enforcement

**All mesh agents must:**
1. Follow completion checklist before marking done
2. Post completion announcement in Mesh Mastermind
3. Update Tasks DB
4. Never leave tasks orphaned

**Violation:** Work may get duplicated, state becomes incoherent.

---

*Continuity Team Approved*
*Quinn Sato — Lead*
