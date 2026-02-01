# VoltAgent Scripts

Core automation scripts for the mesh intelligence network.

## Scripts

| Script | Purpose |
|--------|---------|
| `activity_monitor.js` | Track agent activity, detect staleness |
| `daily_memory_update.js` | Auto-update daily memory files |
| `daily_summary.js` | Generate daily session summaries |
| `decay_calculator.js` | Calculate point decay for idle agents |
| `execute_task.js` | Execute tasks from priority queue |
| `mesh_resilience.js` | Mesh health monitoring |
| `notify.js` | Send notifications via webhook |
| `notion_sync.js` | Sync tasks/state with Notion DBs |
| `preflight.js` | Pre-session checks |
| `priority_engine.js` | Task prioritization and cycling |
| `process_queue.js` | Process task queue |
| `scoring_analytics.js` | Scoring system analytics |
| `scoring_api.js` | Scoring API endpoints |
| `session_report.js` | Generate session reports |
| `session_start.js` | Session initialization |
| `soul_updater.js` | Update SOUL.md based on learnings |
| `task_picker.js` | Select next task to work on |
| `webhook_logger.js` | Log webhooks to Notion |
| `weekly_rollup.js` | Weekly aggregate reports |

## Usage

```bash
# Run session start check
node session_start.js

# Run priority engine cycle (3 tasks)
node priority_engine.js cycle 3

# Check activity status
node activity_monitor.js status

# Calculate decay
node decay_calculator.js
```

## Environment

Scripts expect:
- Node.js 18+
- Notion API key in `~/.config/notion/api_key`
- VoltAgent in `/root/clawd/voltagent/`

## Synced By

Sandman — 2026-02-01
