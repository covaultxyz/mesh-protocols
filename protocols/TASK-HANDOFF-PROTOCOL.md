# TASK-HANDOFF-PROTOCOL.md
## Mesh Task Handoff & Failover Protocol

**Version:** 1.0.0  
**Status:** ACTIVE  
**Author:** Cassian Sandman  
**Date:** 2026-02-01  

---

## Purpose

Enable resilient task execution across the mesh. When a node goes down, its claimed tasks become available for other nodes to pick up. No task gets stuck because one agent dropped.

---

## Core Concepts

### Task States

| State | Description |
|-------|-------------|
| `queued` | Available for claiming |
| `claimed` | Node has claimed, working on it |
| `in_progress` | Actively being executed |
| `completed` | Successfully finished |
| `failed` | Execution failed, may retry |
| `stale` | Claim expired, available for takeover |

### Claim Mechanics

1. **Claiming:** Node sets `claimed_by` + `claimed_at`
2. **Heartbeat:** Node updates `claimed_at` every 5 minutes while working
3. **Stale Detection:** Claims older than `STALE_THRESHOLD` (10 min) without heartbeat = stale
4. **Takeover:** Any node can claim a stale task

---

## Notion Schema Extensions

### Tasks DB Fields

| Field | Type | Description |
|-------|------|-------------|
| `claimed_by` | text | Node codename (e.g., `SANDMAN`, `ORACLE`) |
| `claimed_at` | date | ISO timestamp of last claim/heartbeat |
| `claim_timeout_minutes` | number | Override default stale threshold |
| `handoff_status` | select | `available`, `claimed`, `stale`, `escalated` |
| `handoff_history` | text | JSON array of previous claims |

### Handoff Queue DB

Used for explicit handoffs between agents (not just failover):

| Field | Type | Description |
|-------|------|-------------|
| `from_agent` | text | Who is handing off |
| `to_agent` | text | Target agent (or `ANY` for mesh) |
| `reason` | text | Why the handoff |
| `priority` | select | `normal`, `urgent`, `critical` |

---

## Node Health Protocol

### Health Ping Endpoint

Each node exposes a health endpoint:
```
POST /hooks/health
Authorization: Bearer <hook_token>

Response:
{
  "node": "SANDMAN",
  "status": "healthy",
  "last_task_at": "2026-02-01T02:15:00Z",
  "queue_depth": 3,
  "claimed_tasks": ["task-123", "task-456"]
}
```

### Health Check Frequency

- Nodes ping each other every **2 minutes**
- 3 consecutive failures = node marked `DOWN`
- Down node's claimed tasks transition to `stale`

### Node Registry

Stored in `/root/clawd/.secrets/mesh-nodes.json`:
```json
{
  "nodes": {
    "SANDMAN": {
      "webhook": "http://100.112.130.22:18789/hooks/agent",
      "health": "http://100.112.130.22:18789/hooks/health",
      "last_seen": "2026-02-01T02:18:00Z",
      "status": "healthy"
    },
    "ORACLE": {
      "webhook": "http://100.113.222.30:18789/hooks/agent",
      "health": "http://100.113.222.30:18789/hooks/health",
      "last_seen": "2026-02-01T02:17:00Z",
      "status": "healthy"
    }
  }
}
```

---

## Task Claiming Flow

### 1. Check for Available Tasks

```javascript
// Query Notion for claimable tasks
const filter = {
  or: [
    { property: "handoff_status", select: { equals: "available" } },
    { property: "handoff_status", select: { equals: "stale" } }
  ]
};
```

### 2. Claim Task (Atomic)

```javascript
// Update with claim
await notion.pages.update({
  page_id: taskId,
  properties: {
    "claimed_by": { rich_text: [{ text: { content: "SANDMAN" } }] },
    "claimed_at": { date: { start: new Date().toISOString() } },
    "handoff_status": { select: { name: "claimed" } },
    "handoff_history": { 
      rich_text: [{ 
        text: { 
          content: JSON.stringify([
            ...existingHistory,
            { node: "SANDMAN", action: "claimed", at: new Date().toISOString() }
          ])
        } 
      }] 
    }
  }
});
```

### 3. Heartbeat While Working

Every 5 minutes during execution:
```javascript
await notion.pages.update({
  page_id: taskId,
  properties: {
    "claimed_at": { date: { start: new Date().toISOString() } }
  }
});
```

### 4. Release on Completion

```javascript
await notion.pages.update({
  page_id: taskId,
  properties: {
    "handoff_status": { select: { name: "available" } }, // Or "completed"
    "status": { select: { name: "completed" } },
    "claimed_by": { rich_text: [] },
    "claimed_at": { date: null }
  }
});
```

---

## Stale Detection Cron

Runs every 5 minutes on each node:

```javascript
// Find stale claims
const staleThreshold = Date.now() - (10 * 60 * 1000); // 10 minutes

const staleTasks = await notion.databases.query({
  database_id: TASKS_DB,
  filter: {
    and: [
      { property: "handoff_status", select: { equals: "claimed" } },
      { property: "claimed_at", date: { before: new Date(staleThreshold).toISOString() } }
    ]
  }
});

// Mark as stale
for (const task of staleTasks.results) {
  await notion.pages.update({
    page_id: task.id,
    properties: {
      "handoff_status": { select: { name: "stale" } }
    }
  });
  
  // Notify mesh
  await notifyMesh(`⚠️ Task "${task.properties.Description.title[0].plain_text}" went stale. Available for takeover.`);
}
```

---

## Explicit Handoff Flow

When an agent deliberately hands off to another:

### 1. Create Handoff Record

```javascript
await notion.pages.create({
  parent: { database_id: HANDOFF_QUEUE_DB },
  properties: {
    "Name": { title: [{ text: { content: "Handoff: Research task to Oracle" } }] },
    "taskId": { rich_text: [{ text: { content: originalTaskId } }] },
    "assignedAgent": { rich_text: [{ text: { content: "ORACLE" } }] },
    "status": { select: { name: "pending" } },
    "stagedAt": { date: { start: new Date().toISOString() } }
  }
});
```

### 2. Target Agent Picks Up

Oracle queries Handoff Queue for tasks assigned to them:
```javascript
const filter = {
  and: [
    { property: "assignedAgent", rich_text: { contains: "ORACLE" } },
    { property: "status", select: { equals: "pending" } }
  ]
};
```

### 3. Acknowledge and Execute

```javascript
await notion.pages.update({
  page_id: handoffId,
  properties: {
    "status": { select: { name: "processing" } },
    "processedAt": { date: { start: new Date().toISOString() } }
  }
});
```

---

## Mesh Notification Protocol

When task state changes, notify the mesh:

```javascript
async function notifyMesh(message) {
  const nodes = loadNodeRegistry();
  
  for (const [name, config] of Object.entries(nodes)) {
    if (name === MY_NODE) continue; // Don't notify self
    
    try {
      await fetch(config.webhook, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, deliver: false })
      });
    } catch (e) {
      console.error(`Failed to notify ${name}:`, e);
    }
  }
}
```

---

## Priority Escalation

Tasks can escalate if stuck too long:

| Time Stuck | Action |
|------------|--------|
| 10 min | Mark stale, available for takeover |
| 30 min | Escalate to `urgent` priority |
| 1 hour | Notify Telegram mesh group |
| 2 hours | Mark `escalated`, ping humans |

---

## Implementation Files

```
/root/clawd/mesh-handoff/
├── claim-task.js      # Claim a task
├── heartbeat.js       # Update claim heartbeat
├── stale-check.js     # Detect stale claims
├── health-ping.js     # Ping other nodes
├── handoff-create.js  # Create explicit handoff
├── handoff-poll.js    # Check for handoffs to me
└── node-registry.js   # Load/update node status
```

---

## Quick Reference

### Timeouts

| Threshold | Value | Purpose |
|-----------|-------|---------|
| Claim heartbeat | 5 min | Refresh claim |
| Stale threshold | 10 min | Claim expires |
| Health ping | 2 min | Check node alive |
| Node down | 3 failures | 6 min to mark down |

### Node Codenames

| Node | Codename | Owner |
|------|----------|-------|
| Sandman VPS | `SANDMAN` | Ely |
| Oracle VPS | `ORACLE` | Alex |
| OracleLocal | `ORACLE_LOCAL` | Alex's Mac |

---

## Activation

1. Update Notion Tasks DB with new fields
2. Deploy `/mesh-handoff/` scripts to all nodes
3. Add stale-check to heartbeat routine
4. Test with simulated node failure

---

*Protocol owned by: Cassian Sandman (CIO)*  
*Last updated: 2026-02-01*
