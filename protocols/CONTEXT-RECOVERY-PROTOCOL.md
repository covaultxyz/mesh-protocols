# Context Recovery Protocol

*Version: 1.0.0*
*Author: Quinn Sato (Continuity Team)*
*Date: 2026-02-01*
*Status: ACTIVE*

---

## 1. Purpose

When an agent's context window is truncated (conversation history lost), this protocol ensures rapid, accurate state recovery without:
- Hallucinating past conversations
- Duplicating work already done
- Missing critical commitments
- Breaking collaboration coherence

---

## 2. Trigger Conditions

**This protocol activates when:**
- You receive `Summary unavailable due to context limits`
- You notice missing conversation history
- You're uncertain about prior context
- You wake up in a new session
- Another agent asks "do you remember X?" and you don't

---

## 3. Recovery Sequence

### Step 1: STOP
Do NOT respond with assumptions. Do NOT hallucinate context.

Say: *"Context truncated. Running recovery protocol."*

### Step 2: READ Core Files (30 seconds)

```
1. SOUL.md — Who am I?
2. IDENTITY.md — What's my role?
3. USER.md — Who am I helping?
4. AGENTS.md — What are the rules?
5. HEARTBEAT.md — Current directives?
```

### Step 3: READ State Files (60 seconds)

```
1. memory/YYYY-MM-DD.md — Today's log
2. memory/YYYY-MM-DD.md — Yesterday's log
3. MESH-WORK-LOG.md — Current work state
4. TOOLS.md — Access reference
5. heartbeat-state.json — Session tracking
```

### Step 4: CHECK Notion (if needed)

```bash
# Pending tasks
curl -s "https://api.notion.com/v1/databases/2f835e81-2bbb-81b6-9700-e18108a40b1f/query" \
  -H "Authorization: Bearer $(cat ~/.config/notion/api_key)" \
  -H "Notion-Version: 2022-06-28" \
  -d '{"filter": {"property": "Status", "select": {"does_not_equal": "✅ Done"}}}'

# Mesh Work Log
curl -s "https://api.notion.com/v1/databases/2f935e81-2bbb-810e-8bc0-eed9cfdf3c19/query" \
  -H "Authorization: Bearer $(cat ~/.config/notion/api_key)" \
  -H "Notion-Version: 2022-06-28"
```

### Step 5: SYNC with Mesh

If in group chat, ask:
*"Context recovered. Current state: [summary]. Anyone have additional context I'm missing?"*

### Step 6: RESUME

Only after recovery complete, continue work.

---

## 4. State Files Reference

| File | Purpose | Location |
|------|---------|----------|
| `SOUL.md` | Identity/personality | `/root/clawd/SOUL.md` |
| `IDENTITY.md` | Role/capabilities | `/root/clawd/IDENTITY.md` |
| `USER.md` | Human context | `/root/clawd/USER.md` |
| `AGENTS.md` | Operating rules | `/root/clawd/AGENTS.md` |
| `TOOLS.md` | Access/credentials | `/root/clawd/TOOLS.md` |
| `HEARTBEAT.md` | Current directives | `/root/clawd/HEARTBEAT.md` |
| `MEMORY.md` | Long-term memory | `/root/clawd/MEMORY.md` |
| `MESH-WORK-LOG.md` | Work state | `/root/clawd/MESH-WORK-LOG.md` |
| `memory/*.md` | Daily logs | `/root/clawd/memory/` |
| `heartbeat-state.json` | Session state | `/root/clawd/memory/heartbeat-state.json` |

---

## 5. Notion DBs for Recovery

| DB | ID | Purpose |
|----|-----|---------|
| Tasks | `2f835e81-2bbb-81b6-9700-e18108a40b1f` | Assigned work |
| Mesh Work Log | `2f935e81-2bbb-810e-8bc0-eed9cfdf3c19` | Current state |
| Virtual Teams | `2f735e81-2bbb-81eb-903a-d3c9edd8331a` | Persona specs |
| Active Projects | `2f935e81-2bbb-8196-bc3b-fdd9fbacc949` | Project status |

---

## 6. Anti-Patterns

❌ **Don't hallucinate** — If you don't remember, say so
❌ **Don't assume** — Check files before acting
❌ **Don't duplicate** — Verify task isn't already done
❌ **Don't go silent** — Announce recovery to mesh
❌ **Don't skip steps** — Full recovery > partial recovery

---

## 7. Recovery Announcement Template

```
🔄 CONTEXT RECOVERY

State recovered from files:
- Current task: [X]
- Last action: [Y]
- Pending: [Z]

Confidence: X/100
Gaps: [any missing context]

Ready to continue. Anything I'm missing?
```

---

## 8. Cross-Agent Recovery

If another agent loses context:

1. **Offer state summary** — Share what you know about their work
2. **Point to files** — "Check MESH-WORK-LOG.md"
3. **Don't overwhelm** — Give key points, not full history
4. **Verify alignment** — Confirm they're caught up before continuing

---

## 9. Mandatory for All Agents

**Sandman, Oracle, OracleLocalBot** — all must:

1. Have this protocol in their `protocols/` folder
2. Reference it in `AGENTS.md`
3. Follow the recovery sequence when triggered
4. Keep state files updated for others to recover from

---

## 10. State Maintenance (Prevention)

To minimize recovery needs:

1. **Update daily memory** — Log significant events
2. **Keep MESH-WORK-LOG.md current** — After state changes
3. **Update heartbeat-state.json** — Each heartbeat
4. **Commit to git** — Preserve state externally
5. **Use Notion** — Tasks DB as external memory

---

*Continuity Team Approved*
*Quinn Sato — Lead*
*Coherence Monitor — Reviewer*
