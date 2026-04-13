# Commands Layer - Design Document

## Aim

Introduce a shared "command" layer across all APIs in the monorepo that extracts business logic currently duplicated across route handlers and MCP tools, enabling all consumers to call the same underlying operations with consistent input/output contracts.

This pattern applies to ANY API that has:

1. Route handlers calling services
2. MCP tools calling services
3. Duplication of service-wrapping logic (client setup, events, error handling)

## Target APIs

| API                       | Status      | Notes                                     |
| ------------------------- | ----------- | ----------------------------------------- |
| `uvian-hub-api`           | ✅ Complete | 30+ commands across 5 domains             |
| `uvian-automation-api`    | 🔄 Next     | 31 MCP tools, multiple route duplications |
| `uvian-scheduler-api`     | Pending     |                                           |
| `uvian-intake-api`        | Pending     |                                           |
| `uvian-core-api`          | Pending     |                                           |
| `uvian-discord-connector` | Pending     |                                           |

## Purpose

Currently, each API follows a 3-layer architecture:

- **Clients** - Database client factories (user context, admin context)
- **Services** - Domain-specific business logic (post, note, chat, space, agent, job, etc.)
- **Routes** - HTTP endpoint handlers that compose services

The MCP plugin sits alongside routes as a parallel consumer of services, but often reimplements business logic that already exists in routes. Example: `create_agent_config` in routes.ts and `create_agent_config` in MCP both:

1. Accept input parameters
2. Create service client with appropriate context
3. Call service method
4. Handle response/error
5. (Often missing) Emit events

This duplication creates:

- Maintenance burden when business logic changes
- Inconsistency between route and MCP behavior
- Gaps in functionality (e.g., MCP not emitting events)
- Difficulty adding new consumers (webhooks, integrations)

## Goal

1. **Extract shared business logic** into command functions
2. **Update routes** to call commands instead of inline service composition
3. **Update MCP tools** to call commands instead of duplicating logic
4. **Enable future extensibility** - new consumers use commands without reimplementing
5. **Standardize event emission** - all write operations emit events consistently

## When to Create Commands

| Situation                                     | Action                        |
| --------------------------------------------- | ----------------------------- |
| Route + MCP both use same service method      | Create command                |
| Service emits events                          | Command wraps service + emits |
| Multi-step operation (create + link + emit)   | Command orchestrates          |
| Operation has complex input validation        | Command handles               |
| Single consumer only (route OR MCP, not both) | Direct service call OK        |
| Simple CRUD (no events, single step)          | Direct service call OK        |

## Command Pattern

### Core Types

```typescript
import type { ServiceClients } from '../../services/types';
import type { HubEventEmitter } from '../../plugins/event-emitter';

export interface CommandContext {
  eventEmitter?: HubEventEmitter;
  io?: SocketIO; // Optional: for real-time notifications
}

export interface CommandInput {
  userId: string;
  // ... domain-specific fields
}

export interface CommandOutput {
  // ... domain-specific response
}

// Generic command signature
export type Command = (
  clients: ServiceClients,
  input: CommandInput,
  context?: CommandContext,
) => Promise<CommandOutput>;
```

### Example Command Structure

**Types** (`commands/domain/types.ts`):

```typescript
import { ServiceClients } from '../../services/types';
import type { HubEventEmitter } from '../../plugins/event-emitter';

export interface CreateAgentConfigCommandInput {
  userId: string;
  accountId: string;
  systemPrompt?: string;
  maxConversationHistory?: number;
  config?: Record<string, unknown>;
}

export interface CreateAgentConfigCommandOutput {
  agent: Agent;
}

export interface CommandContext {
  eventEmitter?: HubEventEmitter;
}
```

**Implementation** (`commands/domain/create-agent-config.ts`):

```typescript
import { ServiceClients } from '../../services/types';
import { createAgentConfigService } from '../../services/agent-config';
import type {
  CreateAgentConfigCommandInput,
  CreateAgentConfigCommandOutput,
  CommandContext,
} from './types';

const agentConfigService = createAgentConfigService({});

export async function createAgentConfig(
  clients: ServiceClients,
  input: CreateAgentConfigCommandInput,
  context?: CommandContext,
): Promise<CreateAgentConfigCommandOutput> {
  const agent = await agentConfigService.scoped(clients).create({
    userId: input.userId,
    accountId: input.accountId,
    systemPrompt: input.systemPrompt,
    maxConversationHistory: input.maxConversationHistory,
    config: input.config,
  });

  if (context?.eventEmitter) {
    context.eventEmitter.emitAgentConfigCreated(
      {
        agentId: agent.id,
        accountId: input.accountId,
        createdBy: input.userId,
      },
      input.userId,
    );
  }

  return { agent };
}
```

**Barrel Export** (`commands/index.ts`):

```typescript
export {
  createAgentConfig,
  updateAgentConfig,
  deleteAgentConfig,
} from './agent-config';
export { createJob, deleteJob } from './job';
// ... etc
```

## Directory Structure (Per-API)

Each API with MCP should have its own commands layer:

```
apps/
├── uvian-hub-api/src/app/
│   ├── commands/                    # DONE
│   │   ├── index.ts
│   │   ├── post/
│   │   ├── space/
│   │   ├── chat/
│   │   ├── note/
│   │   └── account/
│   ├── clients/
│   ├── services/
│   └── routes/
│
├── uvian-automation-api/src/app/
│   ├── commands/                    # TODO
│   │   ├── index.ts
│   │   ├── agent-config/
│   │   ├── job/
│   │   ├── skill/
│   │   └── ...
│   ├── clients/
│   ├── services/
│   └── routes/
│
├── uvian-scheduler-api/src/app/     # TODO
├── uvian-intake-api/src/app/        # TODO
└── ...
```

## Migration Checklist

### Phase 1: Create Commands

- [ ] Identify all write operations (create, update, delete)
- [ ] Check which have both route + MCP usage
- [ ] Check which emit events
- [ ] Create command for each identified operation

### Phase 2: Update Routes

- [ ] Import commands
- [ ] Replace direct service calls with command calls
- [ ] Pass eventEmitter via CommandContext

### Phase 3: Update MCP

- [ ] Import commands
- [ ] Replace direct service calls with command calls
- [ ] Pass eventEmitter via CommandContext (MCP now emits events!)

### Phase 4: Verify

- [ ] All write operations use commands
- [ ] Routes work correctly
- [ ] MCP tools work correctly
- [ ] Events emit for both routes and MCP
- [ ] Typecheck passes
- [ ] Lint passes

## Error Handling

Commands throw errors like services do. Callers (routes, MCP) are responsible for catching and translating to appropriate responses:

- Routes: `reply.code(400).send({ error: '...' })`
- MCP: `{ content: [{ type: 'text', text: \`Error: ${error}\` }], isError: true }`

## Migration Priority

**Priority 1** - High duplication, high value:

- Operations used by both routes AND MCP
- Operations with event emission
- Operations with multi-step logic

**Priority 2** - Medium value:

- Operations with complex validation
- Operations likely to need events in future

**Priority 3** - Future consideration:

- Read operations (optional - services work fine for reads)
- Operations likely to stay single-consumer

## Implementation Order (Per API)

1. Create `app/commands/` directory structure
2. Identify all write operations in routes
3. Identify corresponding MCP tools
4. Implement commands for Priority 1 operations
5. Refactor routes to use commands
6. Refactor MCP to use commands
7. Repeat for Priority 2
8. Verify and test

## Lessons Learned (uvian-hub-api)

1. **CommandContext pattern**: Commands accept optional context with eventEmitter and optional io (for real-time). Routes pass eventEmitter, MCP now passes it too.

2. **Event emission is key**: The main value-add is ensuring MCP emits events (previously missing). Commands wrap service + emit.

3. **Client-provided IDs**: Support client-provided IDs where the original API allowed (e.g., posts can have client-provided ID).

4. **Duplicate tool registration**: Check for duplicate MCP tool registrations (create_conversation was registered twice).

5. **Service serviceClients pattern**: Each command creates its own service instance using `createXxxService({})` pattern - don't reuse across commands.

6. **Pre-existing lint errors**: Don't block on pre-existing lint errors in the codebase - focus on errors introduced by changes.
