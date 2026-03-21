# AGENTS.md - Uvian Codebase Guidelines

This file provides guidelines for AI agents operating in the Uvian monorepo.

## Overview

- **Type**: Nx monorepo with npm workspaces
- **Package Manager**: npm (use `npm exec nx` or `npx nx` for commands)
- **Structure**: `apps/` (5 apps), `packages/` (ui, uvian-events), `.agents/skills/`

## Commands

```bash
# Build
npx nx build <project>
npx nx run-many -t build

# Test all
npx nx test <project>

# Single test file (key command!)
npx nx test <project> --testPathPattern=filename.spec.ts

# Lint & Typecheck
npx nx lint <project>
npx nx typecheck <project>

# Serve apps
npx nx serve uvian-web          # Frontend: localhost:3000
npx nx serve uvian-hub-api          # API: localhost:8000
npx nx run-many -t serve -p=uvian-hub-api,uvian-web,uvian-automation-worker
```

### Python Worker (uvian-automation-worker)

```bash
poetry install --with dev
poetry run pytest tests/                    # All tests
poetry run pytest tests/filename_test.py -v  # Single test
```

## TypeScript Guidelines

**Strict settings**: `strict`, `noImplicitOverride`, `noImplicitReturns`, `noUnusedLocals`

- Prefer `interface` for object shapes; use `type` for unions/intersections
- Use `unknown` instead of `any` when type is uncertain
- Use Zod for runtime validation of external data

### Naming Conventions

| Element             | Convention       | Example           |
| ------------------- | ---------------- | ----------------- |
| Files               | kebab-case       | `user-service.ts` |
| React Components    | PascalCase       | `UserProfile.tsx` |
| Variables/Functions | camelCase        | `getUserById`     |
| Types/Interfaces    | PascalCase       | `UserProfile`     |
| Constants           | UPPER_SNAKE_CASE | `MAX_RETRIES`     |

### Import Conventions

```typescript
import { Button } from '@org/ui'; // workspace packages
import { UserCreatedEvent } from '@org/uvian-events';
import { api } from '~/lib/api'; // path alias
import { userService } from '../services/user'; // relative
```

### Formatting

- **Prettier**: Single quotes, **No semicolons** (ASI)
- **ESLint**: Flat config (`eslint.config.mjs`), extends `nx.configs['flat/*']`

## Error Handling

### Fastify API (uvian-hub-api)

```typescript
// Service layer - throw errors
if (error) throw new Error(error.message);

// Route handlers - return error responses
reply.code(500).send({ error: 'Internal server error' });
```

### Next.js (uvian-web)

```typescript
// Server Actions - use navigation APIs
import { redirect, notFound } from 'next/navigation';
// DO NOT wrap navigation APIs in try-catch

// Error boundaries: app/error.tsx, app/not-found.tsx
```

## Frontend Architecture (uvian-web)

### React Server Components (RSC) Patterns

- **Fetch data in server components**, pass to client components
- **Avoid async client components** - parent server component handles async
- **Use `Promise.all()`** for parallel data fetching - avoid waterfalls
- **Server Actions** for mutations - treat like public API endpoints
- **Use Suspense boundaries** for progressive loading

### State Management

| Type         | Solution              |
| ------------ | --------------------- |
| Server state | TanStack Query        |
| Client state | Zustand               |
| Forms        | React Hook Form + Zod |

### Directory Structure

```
lib/domains/[domain]/         components/features/[feature]/
├── api/                      ├── hooks/
├── store/                    ├── components/
├── types.ts                  ├── index.ts
└── utils.ts                  └── types.ts
```

## Backend Architecture (uvian-hub-api)

- **Plugin-based Fastify** with **auto-loading** via `@fastify/autoload`
- **Services** in `src/app/services/`, **Routes** in `src/app/routes/`

## Testing

- Jest with SWC transformation; `node` for APIs, `jsdom` for React
- Test files: `*.spec.ts` or `*.test.ts`

```typescript
describe('UserService', () => {
  it('should create a user', async () => {
    const user = await userService.create({ name: 'Test' });
    expect(user.name).toBe('Test');
  });
});
```

## Available Skills

| Skill                              | Purpose                                         |
| ---------------------------------- | ----------------------------------------------- |
| `next-best-practices`              | Next.js patterns, RSC boundaries, data fetching |
| `vercel-react-best-practices`      | React performance optimization                  |
| `supabase-postgres-best-practices` | Postgres query optimization                     |
| `uvian-web`                        | React code for uvian-web app                    |

## Nx Best Practices

- **Use `nx run`** instead of underlying tooling directly
- **Prefix with npm**: `npm exec nx build` (not just `nx build`)
- **For scaffolding**: Invoke `nx-generate` skill first
- **Use Nx MCP server** tools for workspace queries
