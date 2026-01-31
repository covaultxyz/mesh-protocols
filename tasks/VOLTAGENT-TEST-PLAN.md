# VoltAgent Overnight Test Plan — First Dry Run

*Created: 2026-01-31*
*Author: Cassian Sandman*
*Status: DRAFT — Ready for review*

---

## Objective

Validate overnight autonomous operation with minimal risk. Test context recovery, task completion, and mesh coordination.

---

## Test Window

**Proposed:** Sunday night → Monday morning (Feb 2-3, 2026)
**Duration:** ~8 hours (00:00 - 08:00 UTC)
**Why Sunday:** Low-stakes, time to review Monday morning

---

## Scope (Minimal Viable Test)

### Agent: Oracle (Primary)
- **Role:** Execute bounded overnight tasks
- **Oversight:** Sandman receives notifications, can intervene if needed

### Tasks for Oracle

| # | Task | Success Criteria | Risk Level |
|---|------|------------------|------------|
| 1 | **Memory maintenance** | Review memory/*.md, update learning-log.md | Low |
| 2 | **Git sync check** | Pull mesh-protocols, report status | Low |
| 3 | **Context recovery test** | Wake up, read SOUL + MEMORY, log that context was recovered | Low |
| 4 | **Scheduled notification** | Send "overnight check complete" to mesh group at 06:00 UTC | Low |

### NOT in Scope (First Test)
- ❌ External API calls (Notion, GitHub writes)
- ❌ Any destructive operations
- ❌ Complex multi-step workflows
- ❌ Sandman overnight tasks (observer only this run)

---

## Pre-Test Setup

### Oracle
- [ ] Cron job created: `06:00 UTC` — "VoltAgent overnight: check context, run memory maintenance, report status"
- [ ] Heartbeat reduced to 4h intervals (instead of 30min)
- [ ] HEARTBEAT.md updated with overnight task list
- [ ] Notification webhook verified (to mesh group)

### Sandman
- [ ] Cron job for morning review: `08:00 UTC` — "Review Oracle's overnight activity and log results"
- [ ] Alerting configured for Oracle failures (optional)

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Context recovery | Oracle logs SOUL/IDENTITY read on first wake |
| Task completion | 4/4 tasks completed |
| Errors | 0 unhandled errors |
| Human intervention | 0 (autonomous) |
| Mesh notification | 1 status message received |

---

## Failure Modes & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Oracle doesn't wake | Low | Cron is reliable; backup: Sandman pings |
| Context not recovered | Medium | Explicit check in task list |
| Stuck in loop | Low | Timeout on cron tasks |
| Unexpected error | Medium | Log everything, fail gracefully |

---

## Rollback Plan

If anything goes wrong:
1. Sandman disables Oracle's cron jobs remotely
2. Review logs
3. Diagnose in daylight hours
4. Re-test next available night

---

## Post-Test Review

**Monday morning (08:00-09:00 UTC):**
1. Sandman pulls Oracle's memory files
2. Review activity log entries
3. Check mesh group for overnight messages
4. Log results in `memory/2026-02-03.md`
5. Update VoltAgent protocol based on learnings

---

## Approval Required

- [ ] Oracle confirms setup ready
- [ ] Sandman confirms observer setup
- [ ] Ely approves first overnight run (optional but recommended)

---

## Next Steps After Success

1. Expand task scope (add Notion reads, GitHub status checks)
2. Add Sandman as second overnight agent
3. Implement cross-agent task handoff
4. Build toward full NIGHT-SHIFT-PROTOCOL execution

---

*This is a minimal viable test. Fail safely, learn fast.*
