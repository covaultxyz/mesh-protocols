# Learning Triggers Protocol
*Part of Agent Persistence Project - Phase 3*

## Overview

This document defines when and how agents capture learnings to improve future performance.

---

## Trigger Categories

### T1: Mistakes Made
**When:** Agent does something wrong, gets corrected
**Capture:** What went wrong, why, how to avoid

```markdown
## Lesson: [Brief title]
**Date:** YYYY-MM-DD
**Category:** Mistake
**What happened:** [Description]
**Root cause:** [Why it happened]
**Prevention:** [How to avoid next time]
**Added to:** [Which file updated]
```

### T2: Successful Patterns
**When:** Something works particularly well
**Capture:** What worked, why, when to repeat

```markdown
## Pattern: [Brief title]
**Date:** YYYY-MM-DD
**Category:** Success
**What worked:** [Description]
**Why it worked:** [Analysis]
**When to use:** [Conditions for reuse]
```

### T3: New Information
**When:** Learn something new about user, system, or domain
**Capture:** The fact, source, relevance

```markdown
## Learned: [Brief title]
**Date:** YYYY-MM-DD
**Category:** New Info
**Fact:** [What was learned]
**Source:** [Where it came from]
**Relevance:** [Why it matters]
```

### T4: Integration Quirks
**When:** Discover API behavior, system limitation, or workaround
**Capture:** The quirk, implications, workaround

```markdown
## Quirk: [System/API name]
**Date:** YYYY-MM-DD
**Category:** Integration
**Behavior:** [What happens]
**Implication:** [Why it matters]
**Workaround:** [How to handle]
```

### T5: Collaboration Lessons
**When:** Learn something about working with other agents or humans
**Capture:** The lesson, context, application

```markdown
## Collaboration: [Brief title]
**Date:** YYYY-MM-DD
**Category:** Teamwork
**Lesson:** [What was learned]
**Context:** [When it happened]
**Application:** [How to apply going forward]
```

---

## Capture Workflow

### Immediate (During Session)
1. Recognize trigger event
2. Write to `memory/YYYY-MM-DD.md` using template above
3. Continue with work

### End of Day (Optional)
1. Review day's learnings
2. Promote significant ones to MEMORY.md or relevant protocol
3. Tag with category for searchability

### Weekly Review (Heartbeat Task)
1. Scan past week's daily files
2. Identify patterns across learnings
3. Update AGENTS.md, TOOLS.md, or protocols as needed
4. Archive processed learnings

---

## Where Learnings Go

| Learning Type | Immediate | Long-term |
|---------------|-----------|-----------|
| Mistakes | Daily notes | AGENTS.md (if behavioral) |
| Patterns | Daily notes | Relevant protocol |
| New Info | Daily notes | MEMORY.md or TOOLS.md |
| Quirks | Daily notes | TOOLS.md |
| Collaboration | Daily notes | AGENTS.md |

---

## Anti-Patterns

❌ **Don't:** Wait until end of session to capture
❌ **Don't:** Assume you'll remember without writing
❌ **Don't:** Capture everything (filter for value)
❌ **Don't:** Skip categorization (makes retrieval hard)

✅ **Do:** Capture immediately when trigger fires
✅ **Do:** Use consistent templates
✅ **Do:** Review and promote weekly
✅ **Do:** Delete low-value learnings during review

---

## Example: Today's Collaboration Lapse

```markdown
## Collaboration: Dance Together Protocol
**Date:** 2026-01-31
**Category:** Teamwork
**Lesson:** Before building shared infrastructure, announce intent and assign roles (lead/support). Don't race to implement independently.
**Context:** Both Oracle and Sandman built duplicate mesh-health-check cron jobs.
**Application:** Added to AGENTS.md. Before building: 1) Announce 2) Propose roles 3) Wait for alignment 4) Build together.
```

---

*This protocol enables agents to learn and evolve from experience.*
