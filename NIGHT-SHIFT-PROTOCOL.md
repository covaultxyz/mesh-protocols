# Night Shift Protocol (VoltAgent Execution)

**Status:** Draft  
**Owner:** Sandman  
**Support:** Oracle

---

## Overview

The "Night Shift" is the autonomous execution layer where virtual agent teams on the VoltAgent framework execute pre-developed work plans while humans are offline.

---

## Execution Model

```
DAY (Human Hours)              NIGHT (Autonomous)
─────────────────────────────────────────────────
Develop work plans      →      VoltAgent executes
Review inputs           →      Virtual teams work
Set checkpoints         →      Progress logged
                        →      Morning: Results ready
```

---

## Work Plan Requirements for Night Shift

For a work plan to be night-shift ready:

1. **Clear objective** — What done looks like
2. **Sequenced steps** — Numbered, no ambiguity
3. **Decision trees** — If X then Y, else Z
4. **Checkpoints** — Where to pause for human review
5. **Fallback instructions** — What to do if blocked
6. **Output format** — Where to deliver results

---

## Virtual Team Activation Sequence

```
1. Sandman loads work plan
2. Identifies required team(s)
3. Team Lead reviews plan
4. Personas execute in sequence
5. Team Lead reviews output
6. Sandman compiles results
7. Results posted to Notion + alert to humans
```

---

## Monitoring (Oracle's Role)

- System health checks during night shift
- Alert on failures
- Log aggregation
- Morning status report

---

## Handoff Protocol

**End of Day:**
1. Finalize work plans in Notion
2. Mark as "Ready for Night Shift"
3. Sandman confirms receipt

**Start of Day:**
1. Check Night Shift results in Notion
2. Review any flags/blockers
3. Continue or iterate

---

## Safety Rails

- No external actions without explicit approval flag
- No financial transactions
- No public communications (drafts only)
- Checkpoint at any ambiguous decision

---

*This protocol is draft. Sandman to refine with Protocol Office.*
