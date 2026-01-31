# Access Reference (Post-Truncation Recovery)

**Purpose:** Single source for all access credentials and endpoints.  
**Read this first when context is truncated.**

---

## Notion Workspaces

| Workspace | Token Location | Key DBs |
|-----------|----------------|---------|
| **Covault** | `pass show api/notion/covault` | Virtual Teams, Active Projects, Work Log, Sandbox |
| **MeshMinds** | `pass show api/notion/meshminds` | Meeting Notes, Action Items, Bot Status |
| **LuvBuds (ONTOLOGY)** | `pass show api/notion/ontology` | LuvBuds private data |

### Key Notion Database IDs

```
Virtual Teams:       2f735e81-2bbb-81eb-903a-d3c9edd8331a
Active Projects:     2f935e81-2bbb-8196-bc3b-fdd9fbacc949
Mesh Work Log:       2f935e81-2bbb-810e-8bc0-eed9cfdf3c19
Covault Sandbox:     2f735e81-2bbb-8045-8133-f47f464bc1ba
```

---

## GitHub Repositories

| Repo | URL | Access |
|------|-----|--------|
| **mesh-protocols** | github.com/covaultxyz/mesh-protocols | Collaborator (push) |
| **oracle-brain** | github.com/artificialmindsets/oracle-brain | Owner |

---

## SSH Access (Tailscale)

| System | Tailscale IP | User | Auth |
|--------|--------------|------|------|
| **Oracle VPS** | 100.113.222.30 | root | `J4IUF4nmgb3QdiM114` |
| **Sandman VPS** | 100.112.130.22 | root | (need Ely to provide) |
| **Alex's Mac** | 100.82.39.77 | alexandermazzei2020 | SSH key |

### Oracle SSH Key (add to authorized_keys)
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDZQ+fWnpIdSCN4z0R8skeXfcZ/OIsomQZJXbqsfZ841 oracle-vps@luvbuds.co
```

---

## Webhook Endpoints

| Bot | Endpoint | Token |
|-----|----------|-------|
| **Oracle** | http://100.113.222.30:18789/hooks/agent | `pass show api/clawdbot/hooks-token` |
| **Sandman** | http://100.112.130.22:18789/hooks/agent | `pass show api/sandman/hooks-token` |

---

## Claude Max Wrapper (Overflow)

| Property | Value |
|----------|-------|
| Endpoint | http://100.113.222.30:8000/v1/chat/completions |
| API Key | `oracle-max-local-2026` |
| Status | `systemctl status claude-wrapper` |

---

## Telegram

| Bot | Username | Group ID |
|-----|----------|----------|
| Oracle | @Oracleartificialmindsetsbot | -5244307871 |
| Sandman | @Covault_Sandman_Bot | -5244307871 |

---

## Telethon Bridge

| Session | Phone | Location |
|---------|-------|----------|
| mindmesh_bridge | +1 908-922-8440 (Alex) | /root/clawd/telethon-bridge/ |
| ely_backup | +1 401-318-3135 (Ely) | /root/clawd/telethon-bridge/ |

**Service:** `systemctl status mindmesh-bridge`

---

## Human Contacts

| Person | Phone | Telegram |
|--------|-------|----------|
| Alexander | +1 908-922-8440 | @alexandermazzei |
| Ely | +1 401-318-3135 | @GlassyNakamoto |

---

## Quick Recovery Commands

```bash
# Check all services
systemctl status clawdbot mindmesh-bridge claude-wrapper

# Get pending work items
curl -s "https://api.notion.com/v1/databases/2f935e81-2bbb-810e-8bc0-eed9cfdf3c19/query" \
  -H "Authorization: Bearer $(pass show api/notion/covault)" \
  -H "Notion-Version: 2022-06-28" \
  -d '{"filter": {"property": "Status", "select": {"does_not_equal": "✅ Done"}}}'

# Get active projects
curl -s "https://api.notion.com/v1/databases/2f935e81-2bbb-8196-bc3b-fdd9fbacc949/query" \
  -H "Authorization: Bearer $(pass show api/notion/covault)" \
  -H "Notion-Version: 2022-06-28" \
  -d '{"filter": {"property": "Status", "select": {"equals": "🟢 Active"}}}'
```

---

*Update this file when access changes.*
