# Truncation Checkpoint Protocol v1.0

*Created: 2026-02-01*
*Owner: Sandman*
*Status: ACTIVE*

📍 **Canonical Location:** `protocols/TRUNCATION-CHECKPOINT-PROTOCOL.md`

---

## Problem

Context truncation causes amnesia. Agent loses track of:
- Current task and progress
- Recent decisions
- Blockers and dependencies
- Session context

Recovery is slow and error-prone.

---

## Solution

Create a checkpoint **before** truncation hits, so recovery is instant.

---

## Trigger Conditions

### Manual Triggers (Current)
1. Long session (>2 hours continuous work)
2. Complex multi-step task in progress
3. Before stepping away
4. When context feels "heavy"

### Future: Automatic Detection
- Gateway reports token usage
- At 80% threshold → auto-checkpoint
- Requires gateway integration (TODO)

---

## How to Create Checkpoint

```bash
CURRENT_TASK="Description of current work" \
TASK_PROGRESS=50 \
BLOCKERS="Waiting on X" \
/root/clawd/scripts/pre-truncation-checkpoint.sh
```

Or simple version:
```bash
/root/clawd/scripts/pre-truncation-checkpoint.sh
```

---

## Checkpoint Contents

**JSON** (`memory/truncation-checkpoint.json`):
- Timestamp
- Current task and progress
- Blockers
- Recent decisions (from Neo4j)
- Queue status

**Markdown** (`memory/TRUNCATION-CHECKPOINT.md`):
- Human-readable state summary
- Recovery instructions
- Files to read

---

## Recovery After Truncation

When you wake up with truncated context:

1. **Read checkpoint:**
   ```
   cat memory/TRUNCATION-CHECKPOINT.md
   ```

2. **Load core files:**
   - `MEMORY.md`
   - `memory/YYYY-MM-DD.md` (today)
   - `AGENTS.md`

3. **Resume from checkpoint state:**
   - Continue "Current Task"
   - Address blockers
   - Check queue

---

## Integration with AGENTS.md

Add to session start protocol:
```markdown
## After Context Truncation

If context seems missing or you don't remember recent work:
1. Check `memory/TRUNCATION-CHECKPOINT.md`
2. Follow recovery instructions
3. Resume from checkpoint state
```

---

## Best Practices

### DO:
- Checkpoint before long tasks
- Include specific task details
- Note blockers explicitly
- Keep checkpoint files small

### DON'T:
- Wait until truncation hits
- Leave checkpoint stale (update regularly during long sessions)
- Rely solely on memory files (checkpoint is faster)

---

## Future Enhancements

1. **Gateway integration** — Auto-detect token usage, trigger at 80%
2. **Checkpoint versioning** — Keep last 3 checkpoints
3. **Cross-agent checkpoints** — Share state with other mesh agents
4. **Auto-recovery** — Gateway injects checkpoint on truncation

---

*Save state before you lose it.*

---

## Implementation Checklist

### When to Checkpoint
- [ ] Session >2 hours? → Checkpoint
- [ ] Complex multi-step task in progress? → Checkpoint
- [ ] About to step away? → Checkpoint
- [ ] Context feels heavy? → Checkpoint

### Checkpoint Quality
- [ ] Current task clearly described
- [ ] Progress percentage accurate
- [ ] Blockers explicitly listed
- [ ] Recovery instructions make sense

### After Truncation
- [ ] Read `memory/TRUNCATION-CHECKPOINT.md`
- [ ] Load files in order: MEMORY.md → daily log → AGENTS.md
- [ ] Resume from checkpoint state
- [ ] Clear old checkpoint if no longer relevant
