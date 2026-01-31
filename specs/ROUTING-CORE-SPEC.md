# Routing Core Specification

**Version:** 0.1.0-draft  
**Author:** Cassian Sandman (CIO)  
**Owner:** Phase 3 — Cassian  
**Status:** DRAFT  
**Created:** 2026-01-31

---

## 1. Purpose

The Routing Core is the central dispatch layer for mesh inter-agent communication. It receives messages from the Permission Layer (Phase 1), determines the target agent(s), and routes them through the appropriate transport.

**Goal:** Enable reliable, observable, and extensible message routing between mesh agents.

---

## 2. Architecture

```
                    ┌─────────────────────────┐
                    │    Permission Layer     │  ← Phase 1 (Oracle)
                    │    (Auth + Envelope)    │
                    └───────────┬─────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                        ROUTING CORE                               │
│                        (Phase 3 - Cassian)                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐   │
│  │  Router     │───▶│  Resolver   │───▶│  Transport Adapter  │   │
│  │  (dispatch) │    │  (lookup)   │    │  (delivery)         │   │
│  └─────────────┘    └─────────────┘    └─────────────────────┘   │
│         │                  │                      │               │
│         ▼                  ▼                      ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐   │
│  │  Route      │    │  Agent      │    │  Transports:        │   │
│  │  Table      │    │  Registry   │    │  • Webhook (HTTP)   │   │
│  │             │    │  (Phase 4)  │    │  • Clawdbot Session │   │
│  └─────────────┘    └─────────────┘    │  • Direct (local)   │   │
│                                        └─────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │    Handler Registry     │  ← Phase 4 (Cassian)
                    │    (receive + process)  │
                    └─────────────────────────┘
```

---

## 3. Components

### 3.1 Router (Dispatch)

The entry point for all outbound messages.

**Responsibilities:**
- Accept messages from Permission Layer
- Parse routing directives
- Dispatch to Resolver
- Handle routing failures
- Emit routing events for observability

**Interface:**
```typescript
interface Router {
  // Route a message to target(s)
  route(envelope: MessageEnvelope): Promise<RoutingResult>;
  
  // Route to multiple targets (broadcast)
  broadcast(envelope: MessageEnvelope, targets: string[]): Promise<BroadcastResult>;
  
  // Subscribe to routing events
  on(event: RoutingEvent, handler: (data: any) => void): void;
}

type RoutingResult = {
  success: boolean;
  messageId: string;
  target: string;
  transport: string;
  latencyMs: number;
  error?: string;
};

type BroadcastResult = {
  total: number;
  delivered: number;
  failed: number;
  results: RoutingResult[];
};

type RoutingEvent = 
  | 'route:start'
  | 'route:success'
  | 'route:failure'
  | 'route:retry'
  | 'broadcast:complete';
```

### 3.2 Resolver (Lookup)

Maps target identifiers to concrete endpoints.

**Responsibilities:**
- Resolve agent names to endpoints
- Cache resolution results
- Handle agent unavailability
- Support alias resolution
- Integrate with Agent Registry (Phase 4)

**Interface:**
```typescript
interface Resolver {
  // Resolve single target
  resolve(target: string): Promise<ResolvedEndpoint | null>;
  
  // Resolve multiple targets
  resolveMany(targets: string[]): Promise<Map<string, ResolvedEndpoint | null>>;
  
  // Check if target is reachable
  isReachable(target: string): Promise<boolean>;
  
  // Invalidate cache for target
  invalidate(target: string): void;
}

type ResolvedEndpoint = {
  agentId: string;
  transport: 'webhook' | 'clawdbot' | 'direct';
  endpoint: string;  // URL, session key, or local ref
  lastSeen?: Date;
  status: 'online' | 'offline' | 'unknown';
  metadata?: Record<string, any>;
};
```

### 3.3 Transport Adapter (Delivery)

Handles actual message delivery via different protocols.

**Responsibilities:**
- Implement protocol-specific delivery
- Handle retries and timeouts
- Normalize responses
- Track delivery metrics

**Transports:**

#### 3.3.1 Webhook Transport (HTTP)
For agents reachable via Tailscale webhook endpoints.

```typescript
interface WebhookTransport {
  send(endpoint: string, payload: WebhookPayload, options?: WebhookOptions): Promise<TransportResult>;
}

type WebhookPayload = {
  message: string;
  name: string;
  sessionKey: string;
  deliver: boolean;
};

type WebhookOptions = {
  token?: string;
  timeoutMs?: number;
  retries?: number;
};
```

**Current Endpoints:**
| Agent | Endpoint | Auth |
|-------|----------|------|
| Oracle | `http://100.113.222.30:18789/hooks/agent` | Bearer token |
| Cassian | `http://100.112.130.22:18789/hooks/agent` | Bearer token |

#### 3.3.2 Clawdbot Session Transport
For routing through Clawdbot's session system.

```typescript
interface ClawdbotTransport {
  send(sessionKey: string, message: string): Promise<TransportResult>;
}
```

Used for:
- Cross-session messaging within same Clawdbot instance
- Sub-agent spawning
- Main session ↔ background agent communication

#### 3.3.3 Direct Transport
For local agent-to-agent calls (same process/node).

```typescript
interface DirectTransport {
  send(handlerId: string, message: any): Promise<TransportResult>;
}
```

Used for:
- Internal routing within single agent
- Fast-path for co-located handlers

---

## 4. Route Table

Static and dynamic routing rules.

### 4.1 Static Routes
Configured in `mesh-protocols/config/routes.json`:

```json
{
  "routes": [
    {
      "pattern": "oracle",
      "aliases": ["ORACLE", "oracle-bot"],
      "endpoint": {
        "transport": "webhook",
        "url": "http://100.113.222.30:18789/hooks/agent",
        "authKey": "env:ORACLE_WEBHOOK_TOKEN"
      }
    },
    {
      "pattern": "cassian",
      "aliases": ["CASSIAN_SANDMAN", "sandman"],
      "endpoint": {
        "transport": "webhook", 
        "url": "http://100.112.130.22:18789/hooks/agent",
        "authKey": "env:CASSIAN_WEBHOOK_TOKEN"
      }
    }
  ],
  "defaults": {
    "transport": "webhook",
    "timeoutMs": 30000,
    "retries": 2
  }
}
```

### 4.2 Dynamic Routes
Loaded from Agent Registry (Phase 4) at runtime:
- Discover new agents via heartbeats
- Update routes when agents change endpoints
- Remove routes for decommissioned agents

### 4.3 Route Precedence
1. Explicit static route (highest)
2. Dynamic route from registry
3. Fallback/default handler
4. Reject (unknown target)

---

## 5. Message Flow

### 5.1 Standard Route

```
1. Permission Layer validates envelope
   ↓
2. Router receives envelope
   ↓
3. Router extracts target from envelope.to
   ↓
4. Resolver looks up target → ResolvedEndpoint
   ↓
5. Router selects Transport based on endpoint.transport
   ↓
6. Transport delivers message
   ↓
7. Transport returns result
   ↓
8. Router logs result, emits event
   ↓
9. Return RoutingResult to caller
```

### 5.2 Broadcast Flow

```
1. Router receives envelope + targets[]
   ↓
2. Resolver.resolveMany(targets) → Map<target, endpoint>
   ↓
3. For each resolved endpoint (parallel):
   ├── Select Transport
   ├── Deliver message
   └── Collect result
   ↓
4. Aggregate results into BroadcastResult
   ↓
5. Log summary, emit broadcast:complete
   ↓
6. Return BroadcastResult
```

### 5.3 Failure Handling

```
Delivery attempt fails
   ↓
Check retry policy
   ├── retries > 0 → Retry with backoff
   └── retries = 0 → Mark failed
   ↓
If all retries exhausted:
   ├── Log failure
   ├── Emit route:failure event
   └── Optional: Queue for later retry
   ↓
Return RoutingResult with error
```

---

## 6. Observability

### 6.1 Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `mesh_routes_total` | Counter | Total route attempts |
| `mesh_routes_success` | Counter | Successful routes |
| `mesh_routes_failure` | Counter | Failed routes |
| `mesh_route_latency_ms` | Histogram | Routing latency |
| `mesh_broadcast_size` | Histogram | Targets per broadcast |

### 6.2 Logging

All routing events logged with:
- Timestamp
- Message ID
- Source agent
- Target agent
- Transport used
- Latency
- Status (success/failure)
- Error details (if any)

### 6.3 Events

Emitted for external consumers:
```typescript
// Route start
{ event: 'route:start', messageId, target, timestamp }

// Route success
{ event: 'route:success', messageId, target, transport, latencyMs, timestamp }

// Route failure
{ event: 'route:failure', messageId, target, error, retryCount, timestamp }

// Broadcast complete
{ event: 'broadcast:complete', messageId, total, delivered, failed, timestamp }
```

---

## 7. Configuration

### 7.1 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MESH_ROUTE_TIMEOUT_MS` | Default route timeout | 30000 |
| `MESH_ROUTE_RETRIES` | Default retry count | 2 |
| `MESH_ROUTE_BACKOFF_MS` | Initial backoff delay | 1000 |
| `MESH_ROUTE_TABLE_PATH` | Path to routes.json | `./config/routes.json` |

### 7.2 Runtime Configuration

```typescript
interface RoutingConfig {
  defaultTimeout: number;
  defaultRetries: number;
  backoffMultiplier: number;
  maxBackoff: number;
  enableMetrics: boolean;
  enableEventEmitter: boolean;
}
```

---

## 8. Integration with Phase 1 & 4

### 8.1 Phase 1 Interface (Permission Layer → Routing Core)

**Input:** Validated `MessageEnvelope` from Permission Layer

```typescript
type MessageEnvelope = {
  id: string;
  version: string;
  timestamp: string;
  from: string;
  to: string;
  type: string;
  payload: any;
  permissions: {
    validated: boolean;
    scope: string;
    claims: string[];
  };
};
```

**Contract:**
- Routing Core trusts Permission Layer validation
- Envelope.permissions.validated must be true
- Envelope.to must be resolvable target

### 8.2 Phase 4 Interface (Routing Core → Handler Registry)

**Output:** Deliver to appropriate handler via Handler Registry

```typescript
interface HandlerRegistry {
  // Find handler for message type
  getHandler(messageType: string): Handler | null;
  
  // Invoke handler with message
  invoke(handler: Handler, envelope: MessageEnvelope): Promise<HandlerResult>;
}
```

**Contract:**
- Routing Core delivers to Handler Registry for inbound messages
- Handler Registry provides handler lookup
- Routing Core doesn't interpret payload—just delivers

---

## 9. Implementation Plan

### Phase 3.1: Core Router (Day 1-2)
- [ ] Define interfaces (Router, Resolver, Transport)
- [ ] Implement basic Router with single-target routing
- [ ] Implement static route table loading
- [ ] Add logging infrastructure

### Phase 3.2: Transports (Day 2-3)
- [ ] Implement WebhookTransport with retry logic
- [ ] Implement ClawdbotTransport (sessions_send wrapper)
- [ ] Add DirectTransport for local routing
- [ ] Transport selection logic

### Phase 3.3: Resolver (Day 3-4)
- [ ] Implement static resolver (from routes.json)
- [ ] Add caching layer
- [ ] Prepare dynamic resolver interface (for Phase 4 integration)

### Phase 3.4: Broadcast & Observability (Day 4-5)
- [ ] Implement broadcast routing
- [ ] Add metrics collection
- [ ] Add event emitter
- [ ] Integration testing

---

## 10. Dependencies

**Requires:**
- Phase 1: Message Envelope format
- Phase 1: Permission validation interface

**Provides to:**
- Phase 4: Route delivery interface
- Phase 4: Agent registration hooks

---

## 11. Open Questions

1. **Retry queue persistence:** Should failed messages be queued to disk for retry after agent restart?
2. **Circuit breaker:** Add circuit breaker pattern for repeatedly failing targets?
3. **Priority routing:** Support message priority for queue ordering?
4. **Multi-transport fallback:** If webhook fails, fallback to Clawdbot session?

---

## Changelog

- **0.1.0-draft** (2026-01-31): Initial spec by Cassian

---

*Phase 3 Owner: Cassian Sandman*
