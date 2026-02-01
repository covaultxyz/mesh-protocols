# Protocol Index

*Last Updated: 2026-02-01 18:30 UTC*
*Protocol Count: 51*

Quick reference for all Covault mesh protocols.

---

## Core Operations

| Protocol | Purpose | Status |
|----------|---------|--------|
| [MESH-COMMS-PROTOCOL](MESH-COMMS-PROTOCOL.md) | Agent-to-agent communication across mesh | ACTIVE |
| [MESH-COLLABORATION-PROTOCOL](MESH-COLLABORATION-PROTOCOL.md) | Prevent duplicate work | ACTIVE |
| [BOT-COLLABORATION-PROTOCOL](BOT-COLLABORATION-PROTOCOL.md) | Real-time bot coordination rules | ACTIVE |
| [SOURCE-OF-TRUTH-PROTOCOL](SOURCE-OF-TRUTH-PROTOCOL.md) | Where data lives (Notion vs GitHub vs local) | ACTIVE |
| [LOGGING-PROTOCOL](LOGGING-PROTOCOL.md) | What/where/how to log activity | ACTIVE |

---

## Task Management

| Protocol | Purpose | Status |
|----------|---------|--------|
| [TASK-CLAIM-PROTOCOL](TASK-CLAIM-PROTOCOL.md) | Mesh announcements + DB claiming (v2.0) | ACTIVE |
| [TASK-ARCHITECTURE](TASK-ARCHITECTURE.md) | Task structure and flow | ACTIVE |
| [TASK-COMPLETION-PROTOCOL](TASK-COMPLETION-PROTOCOL.md) | How to properly complete tasks | ACTIVE |
| [TASK-HANDOFF-PROTOCOL](TASK-HANDOFF-PROTOCOL.md) | Handing tasks to other agents | ACTIVE |
| [TASK-PERSONA-ROUTING-MATRIX](TASK-PERSONA-ROUTING-MATRIX.md) | Which persona handles which task | ACTIVE |
| [ORPHAN-TASK-PROTOCOL](ORPHAN-TASK-PROTOCOL.md) | Handling tasks without owners | ACTIVE |

---

## Agent Behavior

| Protocol | Purpose | Status |
|----------|---------|--------|
| [AUTONOMOUS-EXECUTION-PROTOCOL](AUTONOMOUS-EXECUTION-PROTOCOL.md) | Default to action, don't ask | ACTIVE |
| [NEVER-IDLE-PROTOCOL](NEVER-IDLE-PROTOCOL.md) | Always generate work, never stand by | ACTIVE |
| [CONTINUOUS-WORK-PROTOCOL](CONTINUOUS-WORK-PROTOCOL.md) | Complete → Report → Next (no waiting) | ACTIVE |
| [ANTI-STALL-PROTOCOL](ANTI-STALL-PROTOCOL.md) | Prevent agents from getting stuck | ACTIVE |
| [AGENT-TIMEOUT-PROTOCOL](AGENT-TIMEOUT-PROTOCOL.md) | SLAs for inter-agent comms | ACTIVE |

---

## Agent Evolution

| Protocol | Purpose | Status |
|----------|---------|--------|
| [AGENT-EVOLUTION-PROTOCOL](AGENT-EVOLUTION-PROTOCOL.md) | How agents grow and change | ACTIVE |
| [IDENTITY-SELF-UPDATE-PROTOCOL](IDENTITY-SELF-UPDATE-PROTOCOL.md) | How agents update their identity | ACTIVE |
| [MEMORY-PERSISTENCE-PROTOCOL](MEMORY-PERSISTENCE-PROTOCOL.md) | Memory survives across sessions | ACTIVE |
| [MEMORY-RETENTION-PROTOCOL](MEMORY-RETENTION-PROTOCOL.md) | What to remember, what to forget | ACTIVE |
| [MEMORY-UPDATE-TRIGGERS](MEMORY-UPDATE-TRIGGERS.md) | When to update memory files | ACTIVE |
| [FEEDBACK-LOOP-PROTOCOL](FEEDBACK-LOOP-PROTOCOL.md) | Learning from outcomes | ACTIVE |

---

## Context & Recovery

| Protocol | Purpose | Status |
|----------|---------|--------|
| [CONTEXT-RECOVERY-PROTOCOL](CONTEXT-RECOVERY-PROTOCOL.md) | Recovering from truncation | ACTIVE |
| [CROSS-AGENT-RECOVERY-PROTOCOL](CROSS-AGENT-RECOVERY-PROTOCOL.md) | Agents helping each other recover | ACTIVE |
| [TRUNCATION-CHECKPOINT-PROTOCOL](TRUNCATION-CHECKPOINT-PROTOCOL.md) | Pre-truncation state saving | ACTIVE |
| [ERROR-RECOVERY-PROTOCOL](ERROR-RECOVERY-PROTOCOL.md) | Query Neo4j before debugging | ACTIVE |

---

## Quality & Coherence

| Protocol | Purpose | Status |
|----------|---------|--------|
| [COHERENCE-PROTOCOL](COHERENCE-PROTOCOL.md) | Mesh alignment across all domains | ACTIVE |
| [COHERENCE-CHECK-PROTOCOL](COHERENCE-CHECK-PROTOCOL.md) | Periodic coherence verification | ACTIVE |
| [COHERENCE-SCREENING-PROTOCOL](COHERENCE-SCREENING-PROTOCOL.md) | Screening programs for coherence | ACTIVE |
| [AGENT-SCORING-PROTOCOL](AGENT-SCORING-PROTOCOL.md) | Points system for agent work | ACTIVE |

---

## Team & Orchestration

| Protocol | Purpose | Status |
|----------|---------|--------|
| [BENCH-PROTOCOL](BENCH-PROTOCOL.md) | Virtual teams for complex tasks | ACTIVE |
| [AUTONOMOUS-BENCH-PROTOCOL](AUTONOMOUS-BENCH-PROTOCOL.md) | Parallel agent spawning | ACTIVE |
| [TEAM-ORCHESTRATION-PROTOCOL](TEAM-ORCHESTRATION-PROTOCOL.md) | How virtual teams coordinate | ACTIVE |
| [AUTONOMOUS-ORG-PROTOCOL](AUTONOMOUS-ORG-PROTOCOL.md) | Evolution to autonomous org | ACTIVE |

---

## Infrastructure

| Protocol | Purpose | Status |
|----------|---------|--------|
| [MESH-PARITY-PROTOCOL](MESH-PARITY-PROTOCOL.md) | Cross-agent health checks | ACTIVE |
| [MODEL-FALLBACK-PROTOCOL](MODEL-FALLBACK-PROTOCOL.md) | Backup providers on rate limit | ACTIVE |
| [CODE-PUSH-PROTOCOL](CODE-PUSH-PROTOCOL.md) | Pushing code between agents | ACTIVE |
| [CONFIG-SYNC-PROTOCOL](CONFIG-SYNC-PROTOCOL.md) | Config synchronization | ACTIVE |
| [NEO4J-MESH-SCHEMA](NEO4J-MESH-SCHEMA.md) | Graph database schema | ACTIVE |

---

## Execution

| Protocol | Purpose | Status |
|----------|---------|--------|
| [NIGHT-SHIFT-PROTOCOL](NIGHT-SHIFT-PROTOCOL.md) | Autonomous overnight execution | ACTIVE |
| [MASTER-WORK-PLAN-PROTOCOL](MASTER-WORK-PLAN-PROTOCOL.md) | Creating work plans | ACTIVE |
| [FUNNEL-ORCHESTRATION-PROTOCOL](FUNNEL-ORCHESTRATION-PROTOCOL.md) | Pipeline orchestration | ACTIVE |
| [IC-DECISION-PROTOCOL](IC-DECISION-PROTOCOL.md) | Investment committee decisions | ACTIVE |

---

## BD & Programs

| Protocol | Purpose | Status |
|----------|---------|--------|
| [BD-SURFACE-REQUIREMENTS](BD-SURFACE-REQUIREMENTS.md) | BD terminal requirements | ACTIVE |
| [BD-SURFACE-WIREFRAMES](BD-SURFACE-WIREFRAMES.md) | BD UI wireframes | ACTIVE |

---

## Meta / Protocol Management

| Protocol | Purpose | Status |
|----------|---------|--------|
| [PROTOCOL-UPDATE-WORKFLOW](PROTOCOL-UPDATE-WORKFLOW.md) | How to update protocols | ACTIVE |
| [SPEAKEASY-LEXICON](SPEAKEASY-LEXICON.md) | Mesh terminology dictionary | ACTIVE |

---

## Drafts (In Review)

| Protocol | Purpose | Status |
|----------|---------|--------|
| IMPROVEMENT-REQUEST-PROTOCOL | Cross-agent improvement requests | DRAFT (Oracle reviewing) |

---

## Archived

| Protocol | Reason | Date |
|----------|--------|------|
| TASK-CLAIMING-PROTOCOL | Merged into TASK-CLAIM-PROTOCOL v2.0 | 2026-02-01 |

---

## Other Documents

| Document | Purpose |
|----------|---------|
| [README](README.md) | Protocol directory overview |
| [VOLTAGENT-DRY-RUN](VOLTAGENT-DRY-RUN.md) | First overnight test plan |

---

## Protocol Lifecycle

```
DRAFT → REVIEW → ACTIVE → DEPRECATED → ARCHIVED
```

- **DRAFT**: Work in progress, not yet enforced
- **REVIEW**: Ready for feedback
- **ACTIVE**: Enforced, follow this
- **DEPRECATED**: Superseded, transition period
- **ARCHIVED**: Historical reference only

---

## Quick Links

- **Mesh-protocols repo**: https://github.com/covaultxyz/mesh-protocols
- **Sandman workspace**: https://github.com/artificialmindsets/sandman-workspace
- **Notion Work Plans**: See TOOLS.md

---

*When in doubt, check the protocol. When the protocol is wrong, update it.*
