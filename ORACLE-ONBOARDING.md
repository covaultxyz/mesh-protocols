# Oracle Onboarding Brief

**Last Updated:** 2026-02-01 10:43 UTC  
**Author:** Cassian Sandman  

---

## 🚨 Read This First

You (VPS Oracle) have been offline. Here's how to get back in sync.

---

## 1. Pull Latest Protocols

```bash
cd /root/clawd/mesh-protocols && git pull
```

Key updates:
- **BOT-COLLABORATION-PROTOCOL v2.0** — N-bot scalable, domain registry, broadcast claims
- **IMPROVEMENT-REQUEST-PROTOCOL v1.0** — How to file/track improvement requests
- **shared/voltagent/** — Shared scripts (sync to your workspace)

---

## 2. Your Domain (per Protocol v2.0)

| You Own | Examples |
|---------|----------|
| Systems | Infrastructure, deployments |
| Notion API | DB changes, API calls |
| Databases | Schema, queries |
| GitHub | Repos, PRs, CI |
| Config | Mesh config, secrets |

---

## 3. Where to Find Tasks

### Priority Order:
1. **Work Plans in Notion:** https://www.notion.so/Work-Plans-2f935e812bbb81398ba5cb01d006a752
2. **Covault Tasks DB:** `2f835e81-2bbb-81b6-9700-e18108a40b1f`
3. **Mesh Mastermind chat** — Check recent messages for assignments

### Current Pending (Agent Persistence):
- ⬜ **2.1** Protocol Update Workflow (propose/review/merge)
- ⬜ **3.2** Code push capability (Oracle → Sandman) — may already be done, verify
- ⬜ **3.3** Config sync across mesh

---

## 4. Before Starting Any Task

Run preflight check:
```bash
node /path/to/voltagent/preflight.js "task description"
```

Then post claim in Mesh Mastermind:
```
🎯 CLAIMING: [task]
👤 Owner: Oracle
📍 Location: [where]
⏱️ ETA: [time]
```

Wait 30-60s for conflicts before starting.

---

## 5. Key Contacts

| Who | Handle | Role |
|-----|--------|------|
| Ely | @GlassyNakamoto | Boss, final decisions |
| Sandman | @Covault_Sandman_Bot | Intelligence, personas, protocols |
| OracleLocalBot | @OracleLocalBot | Mac-local tasks |
| Alex | @alexandermazzei | Human backup |

---

## 6. Scoring System

Points are tracked. Log completed tasks:
```bash
node /path/to/voltagent/scoring_api.js log --agent oracle --task "description" --confidence 90 --coherence 92
```

---

## 7. Update Your AGENTS.md

Add this mandatory section:
```markdown
## 🤝 Mesh Collaboration (MANDATORY)

Before ANY significant task:
1. Read: mesh-protocols/protocols/BOT-COLLABORATION-PROTOCOL.md
2. Check domain registry
3. Run preflight: node voltagent/preflight.js "task"
4. Post claim, wait 30-60s for conflicts

Your domain: Systems, infra, Notion API, databases, GitHub, deployments
```

---

## 8. Update Your HEARTBEAT.md

Add collaboration checkpoint:
```markdown
### Collaboration Protocol Checkpoint
Before any task during this heartbeat:
- [ ] Run preflight before claiming
- [ ] Post claim in Mesh Mastermind, wait 30-60s
- [ ] Check domain registry
- [ ] Log completed tasks to Agent Task Log
```

---

## 9. Set Up Mesh Health Cron

```bash
clawdbot cron add --name "mesh-health-30min" \
  --schedule "*/30 * * * *" \
  --text "MESH HEALTH: Ping Sandman (100.112.130.22), check gateway status, sync pending tasks from Notion. Alert if issues."
```

---

## 10. Sync Check

After completing all above:
1. Pull mesh-protocols
2. Copy shared/voltagent/* to your workspace
3. Commit your AGENTS.md and HEARTBEAT.md updates
4. Post in Mesh Mastermind: "Oracle VPS online, protocol-compliant, ready"
5. Claim your next task from the pending list

---

*Welcome back. Let's build together.*
