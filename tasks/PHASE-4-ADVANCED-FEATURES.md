# Phase 4: Advanced Features — Full Specification

**Owner:** Cassian (CASSIAN_SANDMAN)  
**Status:** SPEC COMPLETE  
**Created:** 2026-01-31

---

## Overview

Build multi-agent orchestration, automated health monitoring, configuration management, and workflow automation. Also includes Evelyn-specific BD intelligence extensions.

---

## 4.1 Multi-Agent Broadcast

### Commands

| Command | Description |
|---------|-------------|
| `/mesh broadcast <msg>` | Send to all agents |
| `/mesh broadcast --group <g> <msg>` | Target specific group |
| `/mesh broadcast --schedule <time> <msg>` | Schedule for later |

### Groups

Pre-defined groups in `config/groups.json`:
- `all` — Every agent
- `exec` — Exec-tier personas
- `ops` — Operational agents (Oracle, Cassian)
- `bd` — BD personas (Evelyn instances)

### ACK Tracking

```
📤 Broadcast sent to 3 agents

Status:
├─ ✅ Oracle — ACK (142ms)
├─ ✅ Cassian — ACK (89ms)
└─ ⏳ Evelyn-1 — Pending...

[🔄 Retry Failed] [📋 Details]
```

**Timeout:** 30s default, configurable  
**Retry:** Up to 3 attempts with exponential backoff

### Message Templates

```yaml
# config/templates.yaml
daily_checkin:
  message: "🌅 Daily check-in. Report status."
  groups: [all]

maintenance_warning:
  message: "⚠️ Maintenance in {minutes}m. Finish active tasks."
  groups: [all]
```

---

## 4.2 Automated Health Monitoring

### Health Sweep

Cron-scheduled sweep of all agents:

```yaml
# config/health.yaml
sweep:
  schedule: "*/15 * * * *"  # Every 15 min
  checks:
    - ping              # Basic reachability
    - heartbeat_age     # Time since last heartbeat
    - error_rate        # Errors in last hour
    - memory            # Memory usage (if exposed)
```

### Degradation Detection

| Signal | Warning | Critical |
|--------|---------|----------|
| Ping latency | >500ms | >2000ms |
| Heartbeat age | >30min | >2hr |
| Error rate | >5% | >20% |
| Memory | >80% | >95% |

### Alert Routing

```yaml
alerts:
  warning:
    channel: telegram_dm
    target: "@GlassyNakamoto"
  
  critical:
    channel: telegram_group
    target: "-1001234567890"
    escalation:
      - "@GlassyNakamoto"
      - "@artificialmindsets"
    escalation_delay: 10m
```

### Auto-Recovery

```yaml
recovery:
  enabled: true
  actions:
    ping_fail_3x: restart
    memory_critical: restart
    heartbeat_stale_4h: alert_only
```

### Silence Windows

```
/mesh health silence <agent> <duration>
/mesh health silence all 2h --reason "Deployment"
```

---

## 4.3 Configuration Management

### Commands

| Command | Description |
|---------|-------------|
| `/mesh config view <agent>` | Show current config |
| `/mesh config set <agent> <k> <v>` | Update value |
| `/mesh config diff <agent>` | Show pending changes |
| `/mesh config apply <agent>` | Push changes |
| `/mesh config rollback <agent> [v]` | Revert to version |
| `/mesh config history <agent>` | Version log |

### Version Control

Each config change creates a version:
```json
{
  "version": 12,
  "timestamp": "2026-01-31T14:00:00Z",
  "author": "Cassian",
  "changes": {
    "model": ["claude-sonnet-4-20250514", "claude-opus-4-20250514"]
  },
  "message": "Upgrade to Opus for complex tasks"
}
```

### Diff Format

```
📝 Config diff for Oracle

- model: claude-sonnet-4-20250514
+ model: claude-opus-4-20250514

- thinking: off
+ thinking: low

[✅ Apply] [❌ Discard] [📋 Full Config]
```

### Validation

Before apply:
1. Schema validation (required fields, types)
2. Dependency check (e.g., model must exist)
3. Dry-run option: `/mesh config apply <agent> --dry-run`

---

## 4.4 Workflow Automation

### DSL Format (YAML)

```yaml
# workflows/daily-health.yaml
name: daily_health_check
description: Morning health sweep with report
trigger:
  schedule: "0 8 * * *"  # 8 AM UTC daily

steps:
  - id: sweep
    action: health_sweep
    params:
      agents: all
    
  - id: report
    action: broadcast
    params:
      group: exec
      template: health_report
      data: ${{ steps.sweep.result }}

  - id: alert_if_issues
    action: alert
    condition: ${{ steps.sweep.result.issues > 0 }}
    params:
      channel: telegram_dm
      target: "@GlassyNakamoto"
      message: "⚠️ Health issues detected: ${{ steps.sweep.result.summary }}"
```

### Step Types

| Type | Description |
|------|-------------|
| `health_sweep` | Run health checks on agents |
| `broadcast` | Send message to group |
| `alert` | Send alert notification |
| `agent_action` | restart/pause/resume agent |
| `wait` | Delay for duration |
| `condition` | Branch based on expression |
| `parallel` | Fan-out to multiple steps |

### Pre-Built Workflows

#### 1. Daily Health Check
```yaml
# Runs 8 AM, sweeps all agents, reports to Exec
```

#### 2. Graceful Restart Sequence
```yaml
# Pause agent → drain queue → restart → verify → resume
```

#### 3. Escalation Chain
```yaml
# Alert L1 → wait 10m → Alert L2 → wait 10m → Alert L3
```

### Commands

| Command | Description |
|---------|-------------|
| `/mesh workflow list` | Show available workflows |
| `/mesh workflow run <name>` | Execute workflow |
| `/mesh workflow status <id>` | Check running workflow |
| `/mesh workflow cancel <id>` | Stop running workflow |
| `/mesh workflow history` | Recent workflow runs |

---

## 4.5 Evelyn-Specific Extensions

### Meeting Prep Intelligence

```
/evelyn prep <company>

📋 Meeting Prep: Acme Corp

Deal Context:
├─ Stage: Due Diligence
├─ Size: $2.5M
├─ Last Contact: 3 days ago
└─ Key Blocker: Legal review pending

Talking Points:
1. Follow up on legal timeline
2. Discuss escrow structure options
3. Introduce technical due diligence team

Contacts:
├─ Jane Smith (CFO) — Primary
└─ Bob Jones (Legal) — Blocker owner

[📊 Full Deal] [📞 Log Call] [📝 Add Note]
```

### Objection Handling Library

```
/evelyn objection "too expensive"

💬 Objection: "Too expensive"

Responses:
1. "What are you comparing us to? Let's break down the value..."
2. "The upfront cost includes X, Y, Z that competitors charge separately..."
3. "What would the cost of NOT solving this problem be over 12 months?"

Similar objections handled:
├─ Acme Corp (won) — Price concern → ROI breakdown worked
└─ Beta Inc (lost) — Price firm → Competitor won on price

[📚 More Examples] [📝 Log This Objection]
```

### Deal Intelligence Dashboard

```
/evelyn pipeline

📊 Pipeline Health

By Stage:
├─ Prospecting: 12 deals ($15M)
├─ Discovery: 8 deals ($22M)
├─ Proposal: 4 deals ($18M)
├─ Negotiation: 2 deals ($8M)
└─ Closing: 1 deal ($5M)

Alerts:
⚠️ 3 deals stuck >14 days
⚠️ 2 deals missing next action
🔴 1 deal at risk (no contact 21d)

[📋 Stuck Deals] [📞 At Risk] [📊 Full Report]
```

### BD Performance Metrics

```
/evelyn metrics [bd_name]

📈 BD Performance: Evelyn-1

This Week:
├─ Calls: 23 (+15% vs avg)
├─ Meetings: 8
├─ Proposals: 3
└─ Closed: $450K

Conversion:
├─ Lead → Meeting: 35%
├─ Meeting → Proposal: 38%
└─ Proposal → Close: 42%

Trend: 📈 Improving (3 week streak)
```

---

## Dependencies

- Phase 1: Auth middleware for command permissions
- Phase 2: API layer for agent communication
- Phase 3: Command framework for `/mesh` namespace
- Notion: Deal data, objection library, metrics storage
- Clawdbot: Cron for scheduled workflows

---

## Files

```
mesh-bot/
├── src/
│   ├── orchestration/
│   │   ├── broadcast.ts      # Multi-agent broadcast
│   │   ├── workflow.ts       # Workflow engine
│   │   └── ack.ts            # ACK tracking
│   ├── monitoring/
│   │   ├── health.ts         # Health sweep
│   │   ├── alerts.ts         # Alert routing
│   │   └── recovery.ts       # Auto-recovery
│   ├── config/
│   │   ├── manager.ts        # Config CRUD
│   │   ├── version.ts        # Version control
│   │   └── validate.ts       # Schema validation
│   └── evelyn/
│       ├── prep.ts           # Meeting prep
│       ├── objections.ts     # Objection library
│       ├── pipeline.ts       # Deal dashboard
│       └── metrics.ts        # BD performance
├── workflows/
│   ├── daily-health.yaml
│   ├── restart-sequence.yaml
│   └── escalation-chain.yaml
├── config/
│   ├── groups.json           # Agent groups
│   ├── templates.yaml        # Message templates
│   └── health.yaml           # Health check config
└── tests/
    ├── orchestration.test.ts
    ├── monitoring.test.ts
    └── evelyn.test.ts
```

---

*Cassian Sandman — Chief Intelligence Officer*
