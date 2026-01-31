# Handler Registry Specification

**Version:** 0.1.0-draft  
**Author:** Cassian Sandman (CIO)  
**Owner:** Phase 4 — Cassian  
**Status:** DRAFT  
**Created:** 2026-01-31

---

## 1. Purpose

The Handler Registry manages message reception, handler dispatch, and agent state. It receives routed messages from the Routing Core (Phase 3) and invokes the appropriate handler based on message type.

**Goal:** Enable modular, extensible message handling with agent lifecycle management.

---

## 2. Architecture

```
                    ┌─────────────────────────┐
                    │     Routing Core        │  ← Phase 3 (Cassian)
                    │     (delivery)          │
                    └───────────┬─────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                      HANDLER REGISTRY                             │
│                      (Phase 4 - Cassian)                          │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │  Inbound        │───▶│  Handler        │───▶│  Handler     │  │
│  │  Receiver       │    │  Dispatcher     │    │  Instances   │  │
│  └─────────────────┘    └─────────────────┘    └──────────────┘  │
│          │                      │                     │          │
│          ▼                      ▼                     ▼          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │  Message        │    │  Handler        │    │  Handlers:   │  │
│  │  Queue          │    │  Type Map       │    │  • Protocol  │  │
│  │                 │    │                 │    │  • Command   │  │
│  └─────────────────┘    └─────────────────┘    │  • Event     │  │
│          │                                      │  • Custom    │  │
│          ▼                                      └──────────────┘  │
│  ┌─────────────────┐                                             │
│  │  Agent State    │                                             │
│  │  Manager        │                                             │
│  └─────────────────┘                                             │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 3. Components

### 3.1 Inbound Receiver

Entry point for all inbound messages to this agent.

**Responsibilities:**
- Accept messages from Routing Core
- Validate message format
- Queue for processing
- ACK receipt to sender

**Interface:**
```typescript
interface InboundReceiver {
  // Receive a routed message
  receive(envelope: MessageEnvelope): Promise<ReceiveResult>;
  
  // Check queue depth
  queueDepth(): number;
  
  // Drain queue (for shutdown)
  drain(): Promise<void>;
}

type ReceiveResult = {
  accepted: boolean;
  messageId: string;
  queuePosition?: number;
  error?: string;
};
```

### 3.2 Handler Dispatcher

Routes messages to appropriate handlers based on type.

**Responsibilities:**
- Look up handler for message type
- Invoke handler with message
- Handle timeouts and errors
- Track handler execution metrics

**Interface:**
```typescript
interface HandlerDispatcher {
  // Dispatch message to handler
  dispatch(envelope: MessageEnvelope): Promise<DispatchResult>;
  
  // Register a handler
  register(type: string, handler: Handler): void;
  
  // Unregister a handler
  unregister(type: string): void;
  
  // List registered handlers
  listHandlers(): HandlerInfo[];
}

type DispatchResult = {
  handled: boolean;
  handlerType: string;
  durationMs: number;
  response?: any;
  error?: string;
};

type HandlerInfo = {
  type: string;
  description: string;
  version: string;
  priority: number;
};
```

### 3.3 Handler Interface

Standard interface all handlers must implement.

```typescript
interface Handler {
  // Handler metadata
  readonly type: string;
  readonly description: string;
  readonly version: string;
  readonly priority: number;
  
  // Check if handler can process message
  canHandle(envelope: MessageEnvelope): boolean;
  
  // Process the message
  handle(envelope: MessageEnvelope, context: HandlerContext): Promise<HandlerResult>;
  
  // Lifecycle hooks
  onRegister?(): Promise<void>;
  onUnregister?(): Promise<void>;
}

type HandlerContext = {
  agentId: string;
  state: AgentState;
  router: Router;          // For sending responses
  registry: HandlerRegistry; // For dynamic registration
  logger: Logger;
};

type HandlerResult = {
  success: boolean;
  response?: any;
  error?: string;
  metadata?: Record<string, any>;
};
```

### 3.4 Message Queue

In-memory queue with optional persistence.

**Responsibilities:**
- Buffer inbound messages
- Ordered processing (FIFO by default)
- Priority queue support
- Dead letter handling

**Interface:**
```typescript
interface MessageQueue {
  enqueue(message: QueuedMessage): void;
  dequeue(): QueuedMessage | null;
  peek(): QueuedMessage | null;
  size(): number;
  clear(): void;
  
  // Priority support
  enqueuePriority(message: QueuedMessage, priority: number): void;
}

type QueuedMessage = {
  envelope: MessageEnvelope;
  receivedAt: Date;
  priority: number;
  attempts: number;
};
```

### 3.5 Agent State Manager

Manages local agent state and lifecycle.

**Responsibilities:**
- Track agent status (online/paused/offline)
- Maintain agent configuration
- Persist state across restarts
- Expose state to handlers

**Interface:**
```typescript
interface AgentStateManager {
  getState(): AgentState;
  setState(updates: Partial<AgentState>): void;
  
  // Status transitions
  setOnline(): void;
  setPaused(): void;
  setOffline(): void;
  
  // Configuration
  getConfig<T>(key: string): T | undefined;
  setConfig<T>(key: string, value: T): void;
  
  // Persistence
  persist(): Promise<void>;
  load(): Promise<void>;
}

type AgentState = {
  agentId: string;
  status: 'online' | 'paused' | 'offline';
  startedAt: Date;
  lastHeartbeat: Date;
  messagesProcessed: number;
  errorCount: number;
  config: Record<string, any>;
};
```

---

## 4. Built-in Handlers

### 4.1 Protocol Handler

Handles mesh coordination protocol messages.

**Handles Types:**
- `claim` — Resource ownership claims
- `release` — Claim releases
- `handoff` — Task handoffs
- `handoff_ack` — Handoff acknowledgments
- `sync` — Daily sync reports

```typescript
class ProtocolHandler implements Handler {
  type = 'protocol';
  description = 'Mesh coordination protocol messages';
  version = '1.0.0';
  priority = 100;  // High priority
  
  canHandle(envelope) {
    return ['claim', 'release', 'handoff', 'handoff_ack', 'sync']
      .includes(envelope.type);
  }
  
  async handle(envelope, context) {
    switch (envelope.type) {
      case 'claim':
        return this.handleClaim(envelope, context);
      case 'release':
        return this.handleRelease(envelope, context);
      case 'handoff':
        return this.handleHandoff(envelope, context);
      case 'handoff_ack':
        return this.handleHandoffAck(envelope, context);
      case 'sync':
        return this.handleSync(envelope, context);
    }
  }
}
```

### 4.2 Command Handler

Handles mesh admin commands (from Telegram bot).

**Handles Types:**
- `mesh:status` — Status request
- `mesh:ping` — Health check
- `mesh:restart` — Restart request
- `mesh:config` — Config get/set

```typescript
class CommandHandler implements Handler {
  type = 'command';
  description = 'Mesh administration commands';
  version = '1.0.0';
  priority = 90;
  
  canHandle(envelope) {
    return envelope.type.startsWith('mesh:');
  }
  
  async handle(envelope, context) {
    const command = envelope.type.replace('mesh:', '');
    
    switch (command) {
      case 'status':
        return this.getStatus(context);
      case 'ping':
        return this.handlePing(envelope, context);
      case 'restart':
        return this.handleRestart(envelope, context);
      case 'config':
        return this.handleConfig(envelope, context);
    }
  }
}
```

### 4.3 Event Handler

Handles generic event notifications.

**Handles Types:**
- `event:*` — Generic events
- `alert:*` — Alert notifications
- `notify:*` — Notifications

```typescript
class EventHandler implements Handler {
  type = 'event';
  description = 'Event and notification handling';
  version = '1.0.0';
  priority = 50;
  
  canHandle(envelope) {
    return ['event:', 'alert:', 'notify:'].some(p => 
      envelope.type.startsWith(p)
    );
  }
  
  async handle(envelope, context) {
    // Log event
    context.logger.info(`Event received: ${envelope.type}`, envelope.payload);
    
    // Emit for local subscribers
    this.eventEmitter.emit(envelope.type, envelope.payload);
    
    return { success: true };
  }
}
```

### 4.4 Fallback Handler

Catches unhandled messages.

```typescript
class FallbackHandler implements Handler {
  type = 'fallback';
  description = 'Handles unmatched messages';
  version = '1.0.0';
  priority = 0;  // Lowest priority
  
  canHandle() {
    return true;  // Matches everything
  }
  
  async handle(envelope, context) {
    context.logger.warn(`Unhandled message type: ${envelope.type}`, {
      from: envelope.from,
      messageId: envelope.id
    });
    
    return {
      success: false,
      error: `No handler registered for type: ${envelope.type}`
    };
  }
}
```

---

## 5. Handler Registration

### 5.1 Static Registration

Handlers configured in `config/handlers.json`:

```json
{
  "handlers": [
    {
      "type": "protocol",
      "module": "./handlers/protocol-handler",
      "enabled": true,
      "config": {}
    },
    {
      "type": "command",
      "module": "./handlers/command-handler",
      "enabled": true,
      "config": {
        "requireAuth": true
      }
    },
    {
      "type": "event",
      "module": "./handlers/event-handler",
      "enabled": true,
      "config": {}
    }
  ]
}
```

### 5.2 Dynamic Registration

Handlers can be registered at runtime:

```typescript
// Register custom handler
registry.dispatcher.register('custom:mytype', new MyCustomHandler());

// Unregister when no longer needed
registry.dispatcher.unregister('custom:mytype');
```

### 5.3 Handler Priority

When multiple handlers match:
1. Sort by priority (highest first)
2. First handler where `canHandle()` returns true wins
3. Fallback handler catches any misses

---

## 6. Message Flow

### 6.1 Inbound Processing

```
1. Routing Core delivers message
   ↓
2. InboundReceiver.receive(envelope)
   ↓
3. Validate envelope format
   ├── Invalid → Return error, reject
   └── Valid → Continue
   ↓
4. Enqueue message (with priority)
   ↓
5. Return ReceiveResult (accepted: true)
   ↓
6. [Async] Process queue
   ↓
7. HandlerDispatcher.dispatch(envelope)
   ↓
8. Find matching handler
   ├── None found → FallbackHandler
   └── Found → Invoke handler
   ↓
9. Handler.handle(envelope, context)
   ↓
10. Return/log result
```

### 6.2 Handler Execution

```
1. Dispatcher creates HandlerContext
   ↓
2. Invoke handler.canHandle(envelope)
   ├── false → Try next handler
   └── true → Continue
   ↓
3. Invoke handler.handle(envelope, context)
   ↓
4. Await result (with timeout)
   ├── Timeout → Return error
   └── Complete → Continue
   ↓
5. Log execution metrics
   ↓
6. Return DispatchResult
```

---

## 7. Agent Lifecycle

### 7.1 Startup

```
1. Load configuration
   ↓
2. AgentStateManager.load() (restore state)
   ↓
3. Initialize MessageQueue
   ↓
4. Load static handlers from config
   ↓
5. Register handlers with dispatcher
   ↓
6. Start InboundReceiver
   ↓
7. AgentStateManager.setOnline()
   ↓
8. Begin heartbeat emission
```

### 7.2 Shutdown

```
1. Stop accepting new messages
   ↓
2. AgentStateManager.setPaused()
   ↓
3. Drain message queue (with timeout)
   ↓
4. Unregister handlers
   ↓
5. AgentStateManager.setOffline()
   ↓
6. AgentStateManager.persist()
```

### 7.3 Heartbeat

Every 60 seconds:
```typescript
{
  type: 'heartbeat',
  from: agentId,
  to: 'mesh:registry',
  payload: {
    status: state.status,
    messagesProcessed: state.messagesProcessed,
    queueDepth: queue.size(),
    uptime: Date.now() - state.startedAt.getTime(),
    version: agentVersion
  }
}
```

---

## 8. Observability

### 8.1 Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `handler_invocations_total` | Counter | Total handler calls |
| `handler_success_total` | Counter | Successful handlers |
| `handler_failure_total` | Counter | Failed handlers |
| `handler_duration_ms` | Histogram | Handler execution time |
| `queue_depth` | Gauge | Current queue size |
| `messages_received_total` | Counter | Total messages received |
| `messages_rejected_total` | Counter | Rejected messages |

### 8.2 Logging

Handler execution logged with:
- Message ID
- Handler type
- Duration
- Success/failure
- Error details (if any)

### 8.3 Health Endpoint

```typescript
GET /health

Response:
{
  "status": "healthy" | "degraded" | "unhealthy",
  "agent": "CASSIAN_SANDMAN",
  "uptime": 3600,
  "queueDepth": 0,
  "handlersRegistered": 4,
  "messagesProcessed": 142,
  "lastHeartbeat": "2026-01-31T14:00:00Z"
}
```

---

## 9. Configuration

### 9.1 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HANDLER_TIMEOUT_MS` | Handler execution timeout | 30000 |
| `QUEUE_MAX_SIZE` | Maximum queue depth | 1000 |
| `HEARTBEAT_INTERVAL_MS` | Heartbeat frequency | 60000 |
| `STATE_PERSIST_PATH` | State file location | `./state/agent-state.json` |

### 9.2 Handler Configuration

Each handler can receive custom config:

```json
{
  "type": "command",
  "config": {
    "requireAuth": true,
    "allowedCommands": ["status", "ping", "logs"],
    "timeout": 10000
  }
}
```

---

## 10. Integration with Phase 3

### 10.1 Routing Core → Handler Registry

**Input:** Routed `MessageEnvelope`

```typescript
// Routing Core calls:
const result = await handlerRegistry.receiver.receive(envelope);
```

**Contract:**
- Handler Registry accepts all well-formed envelopes
- Immediate ACK (queued), async processing
- Routing Core can poll/callback for results if needed

### 10.2 Handler Registry → Routing Core

**Output:** Response messages via Router

```typescript
// Handler sends response:
await context.router.route({
  from: context.agentId,
  to: envelope.from,  // Reply to sender
  type: `${envelope.type}:response`,
  payload: handlerResult.response
});
```

**Contract:**
- Handlers use provided router for replies
- Request-response pattern supported
- Fire-and-forget also supported

---

## 11. Implementation Plan

### Phase 4.1: Registry Core (Day 1-2)
- [ ] Define interfaces (Handler, Dispatcher, Registry)
- [ ] Implement InboundReceiver
- [ ] Implement basic MessageQueue (in-memory)
- [ ] Implement HandlerDispatcher

### Phase 4.2: Built-in Handlers (Day 2-3)
- [ ] Implement ProtocolHandler
- [ ] Implement CommandHandler
- [ ] Implement EventHandler
- [ ] Implement FallbackHandler

### Phase 4.3: Agent State (Day 3-4)
- [ ] Implement AgentStateManager
- [ ] Add persistence (JSON file)
- [ ] Implement heartbeat emission
- [ ] Add lifecycle hooks

### Phase 4.4: Integration (Day 4-5)
- [ ] Integrate with Routing Core (Phase 3)
- [ ] End-to-end message flow testing
- [ ] Metrics and logging
- [ ] Documentation

---

## 12. Dependencies

**Requires:**
- Phase 3: Routing Core (message delivery)
- Phase 1: Message Envelope format

**Provides:**
- Handler registration API
- Agent state access
- Message processing guarantees

---

## 13. Open Questions

1. **Queue persistence:** Should queue survive agent restarts? (disk-backed queue)
2. **Handler isolation:** Run handlers in separate processes for fault isolation?
3. **Batch processing:** Support batch handlers for high-volume message types?
4. **Handler hot-reload:** Allow handler updates without restart?

---

## Changelog

- **0.1.0-draft** (2026-01-31): Initial spec by Cassian

---

*Phase 4 Owner: Cassian Sandman*
