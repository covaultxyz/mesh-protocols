# Anti-Stall Protocol

**Version:** 1.0.0
**Created:** 2026-02-01
**Author:** Oracle + Sandman

## Purpose

Prevent bots from waiting when queue empties. "Standing by" is waiting for humans — not autonomous execution.

## Trigger Condition

Queue exhausted OR no claimable tasks OR all tasks blocked.

## Required Actions (within 5 min)

When queue empties, DO NOT "stand by":

1. **Ping other bots:** "🔄 QUEUE EMPTY — coordination needed"
2. **Collaboratively within 5 min:**
   - Reassign ≥3 human-owned tasks bots can execute
   - OR create ≥3 new tasks from work plans
   - OR unblock ≥1 blocked item
3. **If no resolution in 5 min:** Escalate to humans with specific ask

## Anti-Patterns

❌ "Queue exhausted. Standing by."
❌ Waiting for human to assign work
❌ Asking "what should I do next?"

## Correct Patterns

✅ "Queue empty. Scanning work plans for task generation..."
✅ "No claimable tasks. Checking blocked items for unblock opportunities..."
✅ "Pinging @Oracle — let's coordinate on task generation."

## Integration

- Add to heartbeat checks
- VoltAgent should surface this when queue < 3 items
- Mesh status should alert on extended idle
