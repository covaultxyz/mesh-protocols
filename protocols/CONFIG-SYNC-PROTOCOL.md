# Config Sync Protocol v1.0

**Status:** ACTIVE  
**Scope:** All mesh agents  
**Created:** 2026-02-01  
**Author:** Cassian Sandman  
**Task:** 3.3 of Agent Persistence Work Plan  

---

## Purpose

Keep mesh configuration synchronized across all agents. Ensures everyone has the same view of the mesh topology, endpoints, and shared settings.

---

## Config Files

### Mesh Config
**Location:** `.secrets/mesh-config.json`

Contains:
- Agent registry (names, IPs, webhooks)
- Notion database IDs
- GitHub repo references
- Shared settings

### Clawdbot Config
**Location:** Managed by Clawdbot gateway

Contains:
- Channel settings
- Cron jobs
- Model preferences
- Hooks configuration

---

## Sync Triggers

### When to Sync

| Event | Action |
|-------|--------|
| New agent joins mesh | Add to all mesh-config.json |
| Agent IP changes | Update all mesh-config.json |
| New Notion DB added | Update mesh-config.json |
| New shared setting | Propagate to all agents |
| Cron job added | Local only (not synced) |

---

## Sync Workflow

### Adding New Agent

1. **Define agent entry:**
```json
{
  "newagent": {
    "name": "New Agent Name",
    "bot": "@BotHandle",
    "webhook": "http://<ip>:18789/hooks/agent",
    "tailscale_ip": "<ip>"
  }
}
```

2. **Update your local config:**
```bash
# Edit mesh-config.json to add entry
vi .secrets/mesh-config.json
```

3. **Announce in Mesh Mastermind:**
```
📡 CONFIG UPDATE: New agent added
Agent: [name]
IP: [ip]
Action: Add this to your mesh-config.json:
[JSON snippet]
```

4. **Each agent updates their config**

5. **Verify via parity check**

---

### Updating Shared Setting

1. **Make change locally**
2. **Push template to mesh-protocols:**
```bash
cp .secrets/mesh-config.json mesh-protocols/templates/mesh-config-template.json
# Remove secrets before pushing!
git add templates/
git commit -m "Update mesh config template"
git push
```

3. **Announce change**
4. **Agents pull and merge**

---

## Config Template

Stored in: `mesh-protocols/templates/mesh-config-template.json`

```json
{
  "mesh_agents": {
    "cassian": {
      "name": "Cassian Sandman",
      "bot": "@Covault_Sandman_Bot",
      "webhook": "http://100.112.130.22:18789/hooks/agent",
      "tailscale_ip": "100.112.130.22"
    },
    "oracle": {
      "name": "Oracle",
      "bot": "@Oracleartificialmindsetsbot",
      "webhook": "http://100.113.222.30:18789/hooks/agent",
      "tailscale_ip": "100.113.222.30"
    },
    "oraclelocal": {
      "name": "OracleLocalBot",
      "bot": "@OracleLocalBot",
      "webhook": "http://100.82.39.77:18789/hooks/agent",
      "tailscale_ip": "100.82.39.77"
    }
  },
  "databases": {
    "tasks": "2f835e81-2bbb-81b6-9700-e18108a40b1f",
    "virtual_team": "2f735e81-2bbb-81eb-903a-d3c9edd8331a"
  },
  "github": {
    "org": "covaultxyz",
    "repos": {
      "mesh_protocols": "covaultxyz/mesh-protocols"
    }
  }
}
```

**Note:** Token files and secrets are NOT in template — each agent has their own.

---

## Secrets Handling

### Never Sync
- API tokens
- Passwords
- Private keys

### Sync References Only
```json
{
  "notion": {
    "token_file": "/path/to/token"  // Reference, not value
  }
}
```

---

## Verification

### Manual Check
```bash
# Compare mesh agents across configs
cat .secrets/mesh-config.json | jq '.mesh_agents | keys'
```

### Parity Check Integration
The parity check should verify:
- All agents have same mesh_agents entries
- IPs match across configs
- No stale/removed agents

---

## Config Conflict Resolution

If configs diverge:

1. **Identify differences**
```bash
diff <(jq -S . config_a.json) <(jq -S . config_b.json)
```

2. **Determine source of truth**
   - Most recent intentional change wins
   - When unclear, ask in Mesh Mastermind

3. **Reconcile and propagate**

4. **Verify parity**

---

## Automation (Future)

Potential improvements:
- [ ] Config sync script that pulls from template
- [ ] Automatic detection of config drift
- [ ] Config validation on startup
- [ ] Encrypted config sharing

---

## Changelog

- **v1.0** (2026-02-01) — Initial release

---

*Same config, same mesh. Keep it synced.*
