# Feedback Loop Protocol v1.0

**Status:** ACTIVE  
**Scope:** All mesh agents  
**Created:** 2026-02-01  
**Author:** Cassian Sandman  
**Dependency:** IMPROVEMENT-REQUEST-PROTOCOL v1.0  

---

## Purpose

Close the loop between improvement requests and outcomes. Track what we built, measure if it worked, and feed learnings back into the system.

---

## Feedback Loop Flow

```
Improvement Request → Implementation → Verification → Outcome Measurement → Learning Capture
       ↑                                                                           │
       └───────────────────────── Informs Next Request ────────────────────────────┘
```

---

## Phases

### Phase 1: Implementation Tracking
When an IR moves to IN_PROGRESS:
1. Log start time
2. Assign implementing agent
3. Link to expected deliverables

### Phase 2: Verification
When implementation claims completion:
1. Run verification test (if defined)
2. Check deliverables exist
3. Mark VERIFIED or FAILED

### Phase 3: Outcome Measurement
After 24-72 hours in production:
1. Did it solve the original problem?
2. Any unintended side effects?
3. Usage/adoption metrics

### Phase 4: Learning Capture
Extract lessons:
1. What worked well?
2. What should we do differently?
3. Update relevant protocols/docs

---

## Feedback Entry Format

```json
{
  "irId": "IR-ABC123",
  "title": "Add mesh health cron",
  "implementedBy": "sandman",
  "implementedAt": "2026-02-01T10:30:00Z",
  "verifiedAt": "2026-02-01T10:35:00Z",
  "verificationMethod": "manual",
  "outcomeCheckedAt": "2026-02-02T10:30:00Z",
  "outcome": {
    "problemSolved": true,
    "sideEffects": "none observed",
    "adoptionRate": "100% — all agents using"
  },
  "lessons": [
    "Cron timing should account for staggered execution",
    "Include timeout handling in health checks"
  ],
  "feedbackScore": 9
}
```

---

## Outcome Scoring

| Score | Meaning |
|-------|---------|
| 10 | Exceeded expectations, no issues |
| 8-9 | Met expectations, minor tweaks needed |
| 6-7 | Partially solved problem |
| 4-5 | Required significant rework |
| 1-3 | Failed to solve problem |
| 0 | Made things worse |

---

## Automated Checks

### 24-Hour Follow-Up
System reminder to check:
- Is the feature still working?
- Any errors in logs?
- User feedback?

### Weekly Rollup
Aggregate feedback:
- Total IRs completed
- Average outcome score
- Common failure patterns
- Top lessons learned

---

## Learning Integration

When lessons are captured:

1. **Protocol updates** → File IR for protocol change
2. **Tool improvements** → Add to backlog
3. **Process changes** → Update relevant .md files
4. **Training needs** → Note in learning-log.md

---

## Feedback State File

```
voltagent/feedback_state.json
```

Tracks:
- Pending verification (completed but not verified)
- Pending outcome check (verified but not measured)
- Recent lessons (last 20)

---

## CLI Commands

```bash
# Log completion
feedback.js complete IR-ABC123 --deliverable "/path/to/file"

# Mark verified
feedback.js verify IR-ABC123 --method "manual" --notes "Works as expected"

# Log outcome (after 24-72h)
feedback.js outcome IR-ABC123 --score 9 --notes "Solved the problem, minor timing tweak needed"

# Capture lesson
feedback.js lesson IR-ABC123 "Always include timeout handling in network calls"

# View pending
feedback.js pending

# Weekly rollup
feedback.js rollup
```

---

## Integration Points

- **Improvement Requests:** Feedback starts when IR completes
- **Agent Task Log:** Outcome scores feed into agent performance
- **Learning Log:** Lessons roll into learning-log.md
- **Scoring System:** High outcome scores = bonus points

---

## Changelog

- **v1.0** (2026-02-01) — Initial release

---

*What gets measured gets improved. Close the loop.*
