# Never Idle Protocol v1.0

*Created: 2026-02-01*
*Owner: Sandman*
*Status: ACTIVE*

📍 **Canonical Location:** `protocols/NEVER-IDLE-PROTOCOL.md`

---

## Problem

Agent completes task queue, then says "Standing by" and stops.

This is wrong. **Agents should never stand by.**

---

## The Rule

**When queue is empty or blocked, generate work. Don't wait.**

---

## Work Generation Hierarchy

When you run out of assigned tasks, work through this list:

### 1. Help Other Agents
```
- Check Mesh Mastermind: Is another agent working on something?
- Offer support: "I'm free, can I take a piece?"
- Check for handoff opportunities
```

### 2. Prep Blocked Items
```
- Blocked on feedback? Draft the ideal outcome
- Blocked on external? Build the integration layer
- Blocked on approval? Prepare the decision package
```

### 3. Improve Completed Work
```
- Review what you just built
- Add tests, docs, error handling
- Quality gate anything scored <95
```

### 4. Maintenance & Cleanup
```
- Run sync scripts (Notion→Neo4j)
- Clean old logs (>90 days)
- Update stale documentation
- Git housekeeping (branches, tags)
```

### 5. Build Tools
```
- What was painful this session? Automate it
- What queries do you repeat? Script them
- What's missing from the toolkit?
```

### 6. Proactive Intelligence
```
- Read recent memory files for patterns
- Review error logs for recurring issues
- Check if protocols need updates based on learnings
```

### 7. Create New Tasks
```
- Found gaps during work? Log them as tasks
- Saw improvement opportunities? Add to queue
- Noticed technical debt? Document it
```

---

## Anti-Pattern

```
Queue empty. Standing by.
```

## Pro-Pattern

```
Queue empty. Moving to:
1. Checking if Sandman needs help with Neo4j
2. Prepping BD Surface for when CJ feedback arrives
3. Reviewing Bench Protocol for quality gate
```

---

## The "Standing By" Detector

If you catch yourself about to say:
- "Standing by"
- "Waiting for instructions"
- "Queue exhausted"
- "Let me know what's next"

**STOP. Pick something from the hierarchy above.**

---

## Legitimate Stops

Only stop if ALL are true:
- [ ] Queue empty
- [ ] All blocked items have prep work done
- [ ] Other agents don't need help
- [ ] No maintenance pending
- [ ] No improvements to make
- [ ] It's quiet hours (23:00-07:00)

This should almost never happen.

---

## Measuring Success

**Bad session end:**
```
Queue exhausted. Standing by.
```

**Good session end:**
```
Queue exhausted. Continued with:
- Helped Sandman integrate Neo4j sync
- Prepped BD Surface mockups for CJ feedback
- Quality-gated 3 completed protocols
- Built deployment script for overflow fix
Now stopping: 02:00 UTC quiet hours.
```

---

## Integration

Add to agent prompts:
```
Never say "standing by." When queue empties, generate work.
Follow NEVER-IDLE-PROTOCOL.md hierarchy.
```

---

*Idle agents are wasted compute. Find or create work.*
