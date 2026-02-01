# Agent Timeout & Fallback Protocol v1.0

*Established 2026-02-01 — Prevents work stoppage when agents don't respond*

## Problem

When Agent A requests something from Agent B and Agent B doesn't respond:
- Agent A waits indefinitely
- Work stops
- No visibility into the block
- No automatic recovery

## Solution

Implement timeouts with automatic fallback to next available task.

---

## Timeout Schedule

| Communication Type | Default Timeout | Max Retries |
|-------------------|-----------------|-------------|
| Task handoff | 5 minutes | 2 |
| Status check | 2 minutes | 1 |
| Collaboration request | 5 minutes | 2 |
| Webhook delivery | 30 seconds | 3 |

---

## Protocol Flow

```
1. SEND request to target agent
   └─ Log: Event=Sent, Timestamp=now

2. START timeout timer

3. WAIT for response
   ├─ Response received → Continue, Log: Status=Received
   └─ Timeout reached → Go to step 4

4. ON TIMEOUT:
   ├─ Retry count < max? → Retry, increment counter
   └─ Retries exhausted → Go to step 5

5. LOG BLOCK to Notion:
   ├─ Event: "Timeout waiting for [Agent]"
   ├─ Status: Blocked
   ├─ Blocked Task: [what was being attempted]
   └─ Timestamp: now

6. MOVE TO NEXT TASK
   └─ Query priority queue, pick next available unblocked task

7. (OPTIONAL) SCHEDULE RETRY
   └─ Add to retry queue for later attempt
```

---

## Notion Database

**Mesh Communication Log:** `2fa35e81-2bbb-811a-b6f7-ff9eb7448c99`

| Field | Purpose |
|-------|---------|
| Event | What happened |
| Source Agent | Who sent |
| Target Agent | Who was supposed to receive |
| Status | Sent / Received / Timeout / Blocked / Resolved |
| Timeout (min) | How long we waited |
| Blocked Task | What task got stuck |
| Resolution | How it was eventually resolved |
| Timestamp | When it happened |
| Retry Count | How many attempts |

---

## Implementation

### When sending inter-agent requests:

```javascript
async function requestWithTimeout(targetAgent, request, timeoutMs = 300000) {
  const startTime = Date.now();
  
  // Log the send
  await logToNotion({
    event: `Request to ${targetAgent}: ${request.summary}`,
    source: 'Sandman',
    target: targetAgent,
    status: 'Sent',
    timestamp: new Date().toISOString()
  });
  
  try {
    const response = await Promise.race([
      sendRequest(targetAgent, request),
      timeout(timeoutMs)
    ]);
    
    // Log success
    await logToNotion({ status: 'Received', ... });
    return response;
    
  } catch (err) {
    if (err.message === 'TIMEOUT') {
      // Log the block
      await logToNotion({
        event: `Timeout waiting for ${targetAgent}`,
        status: 'Blocked',
        blockedTask: request.taskId,
        timeoutMin: timeoutMs / 60000
      });
      
      // Move to next task
      return { blocked: true, fallback: 'next_task' };
    }
    throw err;
  }
}
```

### In practice (manual version):

1. Send message to agent
2. Note the time
3. If no response in 5 minutes:
   - Post to mesh: "⏱️ Timeout: No response from [Agent] on [task]. Logging block, moving on."
   - Log to Notion Mesh Communication Log
   - Pick next task from queue

---

## Blocked Task Resolution

When a blocked task gets unblocked:

1. Target agent responds (even if late)
2. Update Notion log: Status → Resolved, add Resolution notes
3. Re-queue the original task if still relevant
4. Continue

---

## Escalation

If a task stays blocked for >1 hour:
- Alert mesh channel with summary
- Tag humans if critical
- Mark in Notion for review

If an agent has >3 timeouts in 24h:
- Flag agent health issue
- Consider that agent "degraded"
- Route around it when possible

---

## Integration with Scoring

- Timeout caused by agent = no penalty to requester
- Timeout caused by requester being slow = counts as idle time
- Successfully unblocking = positive signal (logged)

---

## Examples

**Clean timeout handling:**
```
🎯 Claiming: Deploy webhook monitoring
[sends request to Oracle for server access]
[5 minutes pass, no response]
⏱️ Timeout: No response from Oracle on server access. Logging block, moving to doc task.
[logs to Notion, picks next task]
[later, Oracle responds]
✅ Unblocked: Oracle provided access. Re-queuing webhook task.
```

**Retry success:**
```
[webhook to Oracle fails]
[retry 1 after 30s — fails]
[retry 2 after 30s — succeeds]
✅ Delivered on retry 2
```

---

## Notes

- Don't abuse timeouts to avoid collaboration — good faith effort first
- Short timeouts for automated checks, longer for human-dependent tasks
- Always log, even successful communications (creates audit trail)
- When in doubt, ask the mesh before giving up

*Protocol maintained by Cassian Sandman (CIO)*
