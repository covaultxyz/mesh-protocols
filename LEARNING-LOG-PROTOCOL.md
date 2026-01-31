# Learning Log Protocol v1.0

*Created: 2026-01-31*
*Part of: Agent Persistence & Self-Evolution (Phase 2.4)*

---

## Purpose

Capture what works, what doesn't, and lessons learned — enabling continuous improvement across sessions and agents.

---

## Log Location

Primary: `memory/learning-log.md` (cumulative)
Secondary: `memory/YYYY-MM-DD.md` (daily capture, then distill)

---

## Entry Types

### ✅ What Worked
```markdown
## ✅ [Topic] — What Worked

**Date:** YYYY-MM-DD
**Context:** [Situation]
**Action:** [What we did]
**Result:** [Positive outcome]
**Lesson:** [Why this should be repeated]
**Tags:** #pattern #success
```

### ❌ What Didn't Work
```markdown
## ❌ [Topic] — What Didn't Work

**Date:** YYYY-MM-DD
**Context:** [Situation]
**Action:** [What we tried]
**Result:** [Failure/suboptimal outcome]
**Root cause:** [Why it failed]
**Lesson:** [What to do differently]
**Tags:** #antipattern #failure
```

### 💡 Insight
```markdown
## 💡 [Topic] — Insight

**Date:** YYYY-MM-DD
**Discovery:** [What we learned]
**Implication:** [How this changes approach]
**Tags:** #insight
```

### 🔧 Workaround
```markdown
## 🔧 [Topic] — Workaround

**Date:** YYYY-MM-DD
**Problem:** [Issue encountered]
**Workaround:** [Temporary solution]
**Proper fix:** [What the real fix would be]
**Tags:** #workaround #technical-debt
```

---

## Capture Triggers

Log when:
- Something unexpectedly failed
- Something worked better than expected
- Discovered an undocumented behavior
- Found a shortcut or optimization
- Made the same mistake twice (pattern!)
- Successfully collaborated with another agent
- Hit a rate limit or constraint

---

## Distillation (Weekly)

During weekly memory maintenance:
1. Review daily memory entries tagged with lessons
2. Extract patterns (repeated successes/failures)
3. Add to `memory/learning-log.md`
4. Update SOUL.md if identity-relevant
5. Update TOOLS.md if operational
6. Update protocols if process-relevant

---

## Cross-Agent Learning

When an agent learns something applicable to others:
1. Tag with `#share` in daily log
2. Post to mesh group or webhook
3. Other agent adds to their learning log
4. If protocol-worthy, propose update

---

## Example Entry

```markdown
## ❌ Notion API — What Didn't Work

**Date:** 2026-01-31
**Context:** Trying to query database with old endpoint
**Action:** Used `/v1/databases/{id}/query`
**Result:** 400 error "endpoint deprecated"
**Root cause:** API version 2025-09-03 renamed databases to data_sources
**Lesson:** Always use `/v1/data_sources/{id}/query` with 2025-09-03 header
**Tags:** #antipattern #notion #api-version
```

---

## Learning Log Index (Template)

```markdown
# Learning Log — [Agent Name]

## Patterns (What Works)
- [Pattern 1] — link to entry
- [Pattern 2] — link to entry

## Anti-patterns (What to Avoid)
- [Anti-pattern 1] — link to entry
- [Anti-pattern 2] — link to entry

## Insights
- [Insight 1] — link to entry

## Active Workarounds
- [Workaround 1] — link to entry (needs proper fix)

## Resolved Lessons
- [Lesson 1] — fixed in protocol X
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol |
