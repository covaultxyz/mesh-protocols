# Model Fallback Protocol v1.0

**Status:** ACTIVE  
**Last Updated:** 2026-01-31  
**Maintainers:** Oracle, Sandman  

---

## Purpose

Define how agents gracefully handle rate limits, outages, or quota exhaustion by automatically falling back to alternative models.

---

## Fallback Chain

### Oracle (Primary Config)
```
1. anthropic/claude-opus-4-5      (Primary)
2. anthropic/claude-sonnet-4      (Fallback 1)
3. openai/gpt-4o                  (Fallback 2)
4. google/gemini-2.0-flash        (Fallback 3)
```

### Sandman (Recommended Config)
```
1. anthropic/claude-sonnet-4      (Primary)
2. openai/gpt-4o                  (Fallback 1)
3. google/gemini-2.0-flash        (Fallback 2)
```

---

## Trigger Conditions

| Condition | Action |
|-----------|--------|
| HTTP 429 (Rate Limit) | Try next model in chain |
| HTTP 529 (Overloaded) | Try next model in chain |
| HTTP 500/502/503 | Retry once, then fallback |
| Timeout (>60s) | Try next model in chain |
| Quota exhausted | Try next model in chain |

---

## Configuration

### Clawdbot Config (clawdbot.json)
```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-5",
        "fallbacks": [
          "anthropic/claude-sonnet-4",
          "openai/gpt-4o",
          "google/gemini-2.0-flash"
        ]
      }
    }
  }
}
```

### Apply via CLI
```bash
clawdbot config set agents.defaults.model.fallbacks '["anthropic/claude-sonnet-4","openai/gpt-4o","google/gemini-2.0-flash"]'
```

---

## Wrapper Endpoints (Subscription-Based)

For unlimited usage via subscription accounts:

| Service | Endpoint | Port | Auth |
|---------|----------|------|------|
| Claude Max | http://100.113.222.30:8000/v1/chat/completions | 8000 | OAuth tokens |
| OpenAI Codex | http://100.113.222.30:8002/v1/chat/completions | 8002 | OAuth tokens (pending) |
| Gemini Pro | http://100.113.222.30:8001/v1/chat/completions | 8001 | API key (pending) |

All wrappers expose OpenAI-compatible endpoints.

---

## Alerting

When fallback occurs:
1. Log to activity log with category "system"
2. If primary unavailable >5 min, alert to Mesh Mastermind group
3. Track fallback frequency in usage metrics

---

## Recovery

When primary becomes available:
1. Clawdbot auto-detects on next request
2. Returns to primary model
3. Log recovery event

---

## Monitoring

Check fallback health:
```bash
# Test each model endpoint
curl -s https://api.anthropic.com/health
curl -s https://api.openai.com/health
curl -s https://generativelanguage.googleapis.com/health
```

---

## Cost Considerations

| Model | Cost Tier | When to Use |
|-------|-----------|-------------|
| Claude Opus | $$$ | Primary, complex tasks |
| Claude Sonnet | $$ | First fallback, most tasks |
| GPT-4o | $$ | Second fallback |
| Gemini Flash | $ | Emergency fallback, high volume |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol - Oracle implemented fallback chain |

---

*This protocol ensures continuous operation even when primary providers are unavailable.*
