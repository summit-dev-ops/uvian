<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable
- When working with Nx configuration or project graph errors, use the `nx_workspace` tool to get any errors
- For Nx best practices, use the `nx_docs` tool instead of assuming things about Nx configuration

# Architecture Guidelines

- **Reference**: Read `.agents/rules/architecture.md` for the single source of truth on architecture. Rules defined there must be followed strictly.

# Development Commands

## Core Nx Commands

```bash
# Development servers
nx serve uvian-web         # Next.js frontend (port 3000)
nx serve uvian-api         # Fastify backend API (port 3001)
nx serve uvian-worker      # Python background worker

# Start all applications
nx run-many -t serve -p=uvian-api,uvian-web,uvian-worker

# Build commands
nx build uvian-web         # Build Next.js frontend
nx build uvian-api         # Build Fastify API
nx build uvian-worker      # Build Python worker

# Build all projects
nx run-many -t build -p=uvian-api,uvian-web,uvian-worker

# Type checking
nx typecheck uvian-web     # TypeScript check frontend
nx typecheck uvian-api     # TypeScript check backend
nx typecheck uvian-worker  # TypeScript check worker

# Check all projects
nx run-many -t typecheck -p=uvian-api,uvian-web,uvian-worker
```

## Testing Commands

### Single Test Execution

```bash
# Run specific test file
nx test uvian-api --testPathPattern=app.spec.ts
nx test uvian-web --testPathPattern=components

# Run tests for specific project
nx test uvian-web
nx test uvian-api
nx test uvian-worker

# Run tests with coverage
nx test uvian-web --coverage

# Run tests in watch mode
nx test uvian-web --watch

# Run affected tests only
nx affected:test

# Run tests with specific verbose output
nx test uvian-web --verbose
```

### Test Organization

- Tests follow Jest convention with `.test.ts` or `.spec.ts` extensions
- Test files are colocated with source files or in `__tests__/` directories
- Nx automatically discovers test configurations via `jest.config.ts`

## Linting & Code Quality

```bash
# Lint specific project
nx lint uvian-web
nx lint uvian-api

# Lint all projects
nx lint

# Lint affected files only
nx affected:lint

# Fix linting issues automatically
nx lint uvian-web --fix
```

## Code Style Guidelines

### TypeScript Configuration

- **Strict Mode**: Enabled across all projects
- **Target**: ES2022 with modern features
- **Module System**: ESNext modules
- **Paths**: Configured for `~/` alias pointing to `src/`

### ESLint Rules

- **Base Configuration**: Nx flat config with TypeScript and React plugins
- **Module Boundaries**: Strict enforcement of project dependencies
- **Accessibility**: JSX-a11y rules for React components
- **Import Organization**: Enforced import patterns and ordering
- **No Unused Variables**: Strict unused variable and import detection

### Code Formatting

- **Formatter**: Prettier with single quotes enabled
- **Quote Style**: Single quotes (`'`) for all strings
- **Semicolons**: Always required
- **Trailing Commas**: Enabled for objects, arrays, and function parameters
- **Line Length**: 80 characters (Prettier default)

### Import Guidelines

#### Import Order (Top to Bottom)

1. **External library imports** (node_modules)
2. **Nx workspace library imports** (@uvian/\*)
3. **Relative imports** (`./`, `../`)
4. **Type imports** (`import type`)

#### Import Examples

```typescript
// ✅ Correct import order
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@uvian/ui';
import { UserProfile } from '../types';
import type { ApiUser } from '../api/types';

// ❌ Wrong import order
import { UserProfile } from '../types';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
```

### Naming Conventions

#### File Naming

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useUserProfile.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Types**: PascalCase with `Type` suffix (`UserType.ts`)

#### Variable & Function Naming

- **Variables**: camelCase (`userProfile`, `isLoading`)
- **Functions**: camelCase (`getUserData`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `API_URL`)
- **Boolean variables**: Use prefixes like `is`, `has`, `can`, `should`
- **Event handlers**: Use `handle` prefix (`handleSubmit`, `handleClick`)

#### React Component Naming

```typescript
// ✅ Component naming
export function UserProfileCard() { ... }
export const MessageList = () => { ... }

// ✅ Hook naming
export function useUserProfile(userId: string) { ... }
export const useMessageList = () => { ... }

// ✅ Component props naming
interface UserProfileCardProps {
  userId: string;
  onEdit?: () => void;
  isEditable: boolean;
}
```

### Error Handling

#### API Error Handling

- Use Try-catch blocks for async operations
- Implement proper error types for different failure scenarios
- Log errors with appropriate context (user actions, API endpoints)
- Never expose sensitive error information to clients

#### Example Error Handling Patterns

```typescript
// ✅ API error handling
try {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new APIError('Failed to fetch users', response.status);
  }
  return await response.json();
} catch (error) {
  if (error instanceof APIError) {
    console.error('API Error:', error.message);
    throw error;
  }
  console.error('Unexpected error:', error);
  throw new Error('An unexpected error occurred');
}

// ✅ React component error boundaries
class ErrorBoundary extends Component {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }
}
```

### React & Next.js Guidelines

#### Component Structure

- Use functional components with hooks
- Implement proper dependency arrays in useEffect
- Use TypeScript interfaces for props
- Keep components focused on presentation logic

#### State Management

- Use Zustand for client-side state
- Use TanStack Query for server state
- Avoid prop drilling; use Context for shared state
- Keep state as close to usage as possible

#### Performance Optimization

- Use React.memo for expensive components
- Implement proper key props for lists
- Lazy load routes and components
- Optimize bundle size with dynamic imports

### Domain-Driven Architecture

#### Directory Structure

```
lib/domains/[domain]/
  ├── api/           # TanStack Query queries & mutations
  ├── store/         # Zustand store slices
  ├── types.ts       # Domain-specific types
  └── utils.ts       # Data transformers

components/features/[feature]/
  ├── hooks/         # Feature orchestrators
  ├── components/    # UI components
  ├── index.ts       # Public API
  └── types.ts       # Feature-specific types
```

#### Key Rules

1. **Domain Sandbox**: Domains cannot import from other domains
2. **Hook Bridge**: Features use orchestrator hooks, not direct API calls
3. **Transformer Rule**: Always transform API data before components
4. **Structural Integrity**: Never move domain logic into feature directories

## Application-Specific Agent Guidelines

### **Frontend Application (uvian-web)**

- **Location**: [`apps/uvian-web/AGENTS.md`](apps/uvian-web/AGENTS.md)
- **Technology**: Next.js 16, React 19, TypeScript
- **Focus**: Domain-driven architecture, state management, real-time UI

**Key Topics:**

- Frontend-specific development commands and workflows
- React and Next.js best practices
- State management patterns with Zustand and TanStack Query
- Real-time Socket.io integration
- Component testing strategies
- Performance optimization for React applications

### **Backend API (uvian-api)**

- **Location**: [`apps/uvian-api/AGENTS.md`](apps/uvian-api/AGENTS.md)
- **Technology**: Fastify 4.29, TypeScript, Socket.io
- **Focus**: Plugin architecture, WebSocket server, job queue management

**Key Topics:**

- Fastify plugin development patterns
- WebSocket server implementation
- Database integration with Supabase
- Job queue management with BullMQ
- API testing with Fastify injection
- Error handling and logging strategies

### **Background Worker (uvian-worker)**

- **Location**: [`apps/uvian-worker/AGENTS.md`](apps/uvian-worker/AGENTS.md)
- **Technology**: Python 3.11+, Poetry, asyncio, BullMQ
- **Focus**: Repository patterns, AI integration, async job processing

**Key Topics:**

- Repository and executor patterns
- Async Python programming with asyncio
- AI integration with RunPod
- Job processing pipeline design
- Event-driven architecture with Redis
- Performance monitoring and optimization

## Development Workflow Reference

### **Quick Access to App-Specific Guidelines**

For technology-specific questions or development patterns:

1. **Frontend Issues**: Check [`apps/uvian-web/AGENTS.md`](apps/uvian-web/AGENTS.md)

   - React component patterns
   - State management solutions
   - UI/UX best practices
   - Frontend testing approaches

2. **Backend Issues**: Check [`apps/uvian-api/AGENTS.md`](apps/uvian-api/AGENTS.md)

   - API design patterns
   - Database operations
   - Real-time communication
   - Service architecture

3. **Worker Issues**: Check [`apps/uvian-worker/AGENTS.md`](apps/uvian-worker/AGENTS.md)
   - Async Python patterns
   - Job processing workflows
   - AI integration patterns
   - Performance optimization

### **Cross-Application Development**

When working on features that span multiple applications:

1. **Start with Architecture Review**: Read [`.agents/rules/architecture.md`](.agents/rules/architecture.md)
2. **Check Relevant App Guidelines**: Review app-specific AGENTS.md files
3. **Understand Service Communication**: Study the full-stack architecture documentation
4. **Follow Established Patterns**: Maintain consistency across applications

### **Getting Started Commands**

```bash
# Frontend development
cd apps/uvian-web
nx serve uvian-web

# Backend API development
cd apps/uvian-api
nx serve uvian-api

# Worker development
cd apps/uvian-worker
nx start-worker uvian-worker

# Full stack development
nx run-many -t serve -p=uvian-api,uvian-web,uvian-worker
```

<!-- nx configuration end-->
