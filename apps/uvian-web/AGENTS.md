# Uvian Web - Agent Guidelines

This document provides specific guidelines for AI coding agents working on the **uvian-web** Next.js frontend application.

## 🏗️ Application Overview

- **Technology**: Next.js 16, React 19, TypeScript
- **Architecture**: Domain-driven with feature-based components
- **State Management**: Zustand + TanStack Query
- **Styling**: Tailwind CSS + shadcn/ui
- **Port**: 3000 (development)

---

## 🚀 Development Commands

### **Core Commands**

```bash
# Start development server
nx serve uvian-web

# Build for production
nx build uvian-web

# Start production server
nx start uvian-web

# Run tests
nx test uvian-web

# Type checking
nx typecheck uvian-web

# Linting
nx lint uvian-web
```

### **Testing Commands**

```bash
# Run all tests
nx test uvian-web

# Run in watch mode
nx test uvian-web --watch

# Run with coverage
nx test uvian-web --coverage

# Run specific test file
nx test uvian-web --testPathPattern=components
```

---

## 🏗️ Architecture Guidelines

### **Domain-Driven Structure**

The application follows strict domain-driven architecture. Always maintain this separation:

#### **Domain Directory Structure (8-File Pattern)**

```
lib/domains/[domain]/
├── api/
│   ├── index.ts         # Public API exports
│   ├── keys.ts          # Query key factory
│   ├── queries.ts       # TanStack Query queryOptions
│   └── mutations.ts     # TanStack Query mutationOptions
├── store/
│   ├── index.ts         # Store slice exports
│   └── [domain]-slice.ts # Zustand store slice
├── types.ts             # Domain-specific types (API & UI)
└── utils.ts             # Transformers & cache utilities
```

#### **Feature Directory Structure**

```
components/features/[feature]/
├── hooks/         # Feature orchestrators
├── components/    # UI components
├── index.ts       # Public feature API
└── types.ts       # Feature-specific types
```

### **Critical Architecture Rules**

1. **Domain Sandbox Rule**: Domains cannot import from other domains
2. **Hook Bridge Rule**: Features use orchestrator hooks, not direct API calls
3. **Transformer Rule**: Always transform API data before components
4. **Structural Integrity**: Never move domain logic into feature directories

### **Query Key Factory Pattern**

#### **Standard Query Keys Structure**

Each domain implements a consistent query key factory pattern for cache management:

```typescript
// keys.ts - Standard pattern across all domains
export const domainKeys = {
  all: ['domain'] as const, // Base namespace for isolation
  lists: () => [...domainKeys.all, 'list'] as const,
  list: () => [...domainKeys.lists()] as const,
  details: () => [...domainKeys.all, 'detail'] as const,
  detail: (id: string) => [...domainKeys.details(), id] as const,
  related: (id: string) => [...domainKeys.detail(id), 'related'] as const,
};
```

#### **Implementation Examples**

**Chat Domain Keys:**

```typescript
export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...chatKeys.all, 'conversation', id] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, 'messages', conversationId] as const,
  conversationMembers: (conversationId: string) =>
    [...chatKeys.all, 'conversation-members', conversationId] as const,
};
```

**Spaces Domain Keys:**

```typescript
export const spacesKeys = {
  all: ['spaces'] as const,
  lists: () => [...spacesKeys.all, 'list'] as const,
  list: () => [...spacesKeys.lists()] as const,
  details: () => [...spacesKeys.all, 'detail'] as const,
  detail: (id: string) => [...spacesKeys.details(), id] as const,
  members: (spaceId: string) =>
    [...spacesKeys.detail(spaceId), 'members'] as const,
};
```

**User Domain Keys:**

```typescript
export const userKeys = {
  all: ['user'] as const,
  profile: (profileId?: string) =>
    profileId
      ? ([...userKeys.all, 'profile', profileId] as const)
      : ([...userKeys.all, 'profile'] as const),
  settings: (profileId?: string) =>
    profileId
      ? ([...userKeys.all, 'settings', profileId] as const)
      : ([...userKeys.all, 'settings'] as const),
};
```

#### **Cache Management Patterns**

**Automatic Invalidation:**

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: domainKeys.list() });
  queryClient.invalidateQueries({ queryKey: domainKeys.detail(id) });
};
```

**Optimistic Updates with Rollback:**

```typescript
// Complete optimistic update pattern with error recovery
createConversation: (queryClient: QueryClient) => ({
  mutationFn: async (payload) => {
    const { data } = await apiClient.post<ConversationAPI>(
      `/api/conversations`,
      payload
    );
    return chatUtils.conversationApiToUi(data);
  },

  onMutate: async (payload) => {
    // 1. Cancel outgoing refetches to prevent race conditions
    await queryClient.cancelQueries({ queryKey: chatKeys.conversations() });

    // 2. Snapshot previous state for rollback
    const previousConversations = queryClient.getQueryData<ConversationUI[]>(
      chatKeys.conversations()
    );

    // 3. Create optimistic conversation
    const optimisticConversation: ConversationUI = {
      id: payload.id, // Client-generated ID
      title: payload.title,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending', // Mark as pending sync
    };

    // 4. Optimistically update cache
    queryClient.setQueryData<ConversationUI[]>(
      chatKeys.conversations(),
      (old) =>
        old ? [...old, optimisticConversation] : [optimisticConversation]
    );

    // 5. Return context for rollback
    return { previousConversations };
  },

  onError: (error, payload, context) => {
    // 6. Rollback on error - restore previous state
    if (context?.previousConversations) {
      queryClient.setQueryData(
        chatKeys.conversations(),
        context.previousConversations
      );
    }

    // 7. Optional: Show user feedback
    console.error('Failed to create conversation:', error);
  },

  onSuccess: (newConversation) => {
    // 8. Invalidate to sync with server data
    queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });

    // 9. Optional: Update related caches
    queryClient.invalidateQueries({
      queryKey: chatKeys.conversation(newConversation.id),
    });
  },
});
```

**Complex Optimistic Update with Bulk Operations:**

```typescript
// Bulk delete with optimistic updates
bulkDeleteConversations: (queryClient: QueryClient) => ({
  mutationFn: async (conversationIds: string[]) => {
    const promises = conversationIds.map((id) =>
      apiClient.delete(`/api/conversations/${id}`)
    );
    await Promise.all(promises);
    return conversationIds;
  },

  onMutate: async (conversationIds) => {
    // Cancel related queries
    await queryClient.cancelQueries({
      queryKey: chatKeys.conversations(),
    });

    // Snapshot current state
    const previousConversations = queryClient.getQueryData<ConversationUI[]>(
      chatKeys.conversations()
    );

    // Optimistically remove items
    queryClient.setQueryData<ConversationUI[]>(
      chatKeys.conversations(),
      (old) => old?.filter((conv) => !conversationIds.includes(conv.id)) || []
    );

    // Clear individual conversation caches
    conversationIds.forEach((id) => {
      queryClient.removeQueries({
        queryKey: chatKeys.messages(id),
      });
      queryClient.removeQueries({
        queryKey: chatKeys.conversation(id),
      });
    });

    return { previousConversations, deletedIds: conversationIds };
  },

  onError: (error, deletedIds, context) => {
    // Rollback deleted conversations
    if (context?.previousConversations) {
      queryClient.setQueryData(
        chatKeys.conversations(),
        context.previousConversations
      );
    }

    // Restore individual conversation caches
    deletedIds.forEach((id) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversation(id),
      });
    });
  },

  onSuccess: (deletedIds) => {
    // Invalidate list to get final server state
    queryClient.invalidateQueries({
      queryKey: chatKeys.conversations(),
    });
  },
});
```

**Streaming Message Optimistic Updates:**

```typescript
// Send message with optimistic update for immediate UI feedback
sendMessage: (queryClient: QueryClient, conversationId: string) => ({
  mutationFn: async (payload) => {
    const { data } = await apiClient.post<MessageAPI>(
      `/api/conversations/${conversationId}/messages`,
      payload
    );
    return chatUtils.messageApiToUi(data);
  },

  onMutate: async (payload) => {
    // Create optimistic message
    const optimisticMessage: MessageUI = {
      id: payload.id, // Client-generated ID
      conversationId,
      content: payload.content,
      role: payload.role || 'user',
      createdAt: new Date(),
      senderId: 'current-user-id',
      syncStatus: 'pending',
      isStreaming: false,
    };

    // Optimistically add to messages cache
    queryClient.setQueryData<MessageUI[]>(
      chatKeys.messages(conversationId),
      (old) => [...(old || []), optimisticMessage]
    );

    // Scroll to bottom (UI coordination)
    scrollToBottom();
  },

  onError: (error, payload, context) => {
    // Remove optimistic message on error
    queryClient.setQueryData<MessageUI[]>(
      chatKeys.messages(conversationId),
      (old) => old?.filter((msg) => msg.id !== payload.id) || []
    );
  },

  onSuccess: (serverMessage) => {
    // Replace optimistic message with server data
    queryClient.setQueryData<MessageUI[]>(
      chatKeys.messages(conversationId),
      (old) =>
        old?.map((msg) => (msg.id === payload.id ? serverMessage : msg)) || []
    );
  },
});
```

**Selective Cache Removal:**

```typescript
// Remove specific cache entries
queryClient.removeQueries({ queryKey: domainKeys.detail(id) });
queryClient.removeQueries({ queryKey: domainKeys.related(id) });

// Remove with exact match
queryClient.removeQueries({
  queryKey: chatKeys.messages(conversationId),
  exact: true,
});

// Remove all queries for a domain
queryClient.removeQueries({
  queryKey: chatKeys.all,
  exact: false,
});
```

**Selective Cache Removal:**

```typescript
queryClient.removeQueries({ queryKey: domainKeys.detail(id) });
queryClient.removeQueries({ queryKey: domainKeys.related(id) });
```

---

## 💻 Code Style Guidelines

### **Import Organization**

**Import Order (Top to Bottom):**

1. External library imports (node_modules)
2. Nx workspace library imports (@uvian/\*)
3. Relative imports (./, ../)
4. Type imports (import type)

**Example:**

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
```

### **File Naming Conventions**

- **Components**: kebab-case (`user-profile.tsx`)
- **Hooks**: kebab-case with `use` prefix (`use-user-profile.ts`)
- **Utilities**: kebab-case (`format-date.ts`)
- **Constants**: kebab-case (`kebab-case.ts`)
- **Types**: kebab-case with `Type` suffix (`user-type.ts`)

### **Naming Patterns**

#### **Variables & Functions**

- **Variables**: camelCase (`userProfile`, `isLoading`)
- **Functions**: camelCase (`getUserData`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `API_URL`)
- **Booleans**: Use prefixes (`is`, `has`, `can`, `should`)
- **Event handlers**: Use `handle` prefix (`handleSubmit`, `handleClick`)

#### **React Components**

```typescript
// ✅ Component naming
export function UserProfileCard() { ... }
export const MessageList = () => { ... }

// ✅ Hook naming
export function useUserProfile(userId: string) { ... }
export const useMessageList = () => { ... }

// ✅ Component props
interface UserProfileCardProps {
  userId: string;
  onEdit?: () => void;
  isEditable: boolean;
}
```

---

## ⚛️ React & Next.js Guidelines

### **Component Structure**

- Use functional components with hooks
- Implement proper dependency arrays in useEffect
- Use TypeScript interfaces for props
- Keep components focused on presentation logic

### **State Management**

#### **Dual-Layer State Architecture**

The application implements a sophisticated dual-layer state management approach:

- **Client State**: Zustand for UI state, drafts, and local interactions
- **Server State**: TanStack Query for API data, cache management, and synchronization

#### **Complex State Coordination Patterns**

**Store + Query Cache Synchronization:**

```typescript
// hooks/use-chat.ts - Orchestrate dual state layers
export function useChat(conversationId: string) {
  const { data: messages, isLoading } = useQuery(
    chatQueries.messages(conversationId)
  );
  const { socket } = useSocket();
  const store = useChatStore();

  // Coordinate between TanStack Query cache and Zustand store
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join real-time room
    socket.emit('join_conversation', conversationId);

    // Real-time message updates affect query cache
    socket.on('new_message', (messageAPI) => {
      const messageUI = chatUtils.messageApiToUi(messageAPI);
      chatUtils.addMessageToCache(queryClient, conversationId, messageUI);
    });

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message');
    };
  }, [socket, conversationId]);

  return {
    messages,
    isLoading,
    draft:
      store.conversationCache[conversationId]?.composition.messageDraft || '',
    setDraft: (draft: string) =>
      store.setConversationMessageDraft(conversationId, draft),
    activeConversation: store.activeConversationId === conversationId,
  };
}
```

#### **Cache Coordination Utilities**

**Query Cache + Store Synchronization:**

```typescript
// utils.ts - Coordinate query cache updates with store state
export function coordinateCacheUpdate(
  queryClient: QueryClient,
  store: ChatStore,
  conversationId: string,
  update: (messages: MessageUI[]) => MessageUI[]
): void {
  // Update query cache
  queryClient.setQueryData<MessageUI[]>(
    chatKeys.messages(conversationId),
    update
  );

  // Optional: Update store state if needed
  const currentDraft =
    store.conversationCache[conversationId]?.composition.messageDraft;
  if (currentDraft) {
    store.setConversationMessageDraft(conversationId, currentDraft);
  }
}
```

**Bulk State Coordination:**

```typescript
// Coordinate multiple cache updates
export function bulkCoordinateUpdates(
  queryClient: QueryClient,
  store: ChatStore,
  conversationIds: string[]
): void {
  conversationIds.forEach((id) => {
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: chatKeys.messages(id) });

    // Clear store cache
    store.clearConversationCache(id);
  });

  // Update active conversation if needed
  if (conversationIds.includes(store.activeConversationId)) {
    store.setActiveConversation(null);
  }
}
```

#### **State Management Best Practices**

- **Clear Separation**: Zustand for UI state, TanStack Query for server data
- **Cache Coordination**: Use utilities to maintain consistency between layers
- **Per-Context Isolation**: Conversation-specific state isolation
- **Real-time Integration**: Socket events directly update query cache
- **Optimistic Updates**: Immediate UI feedback with server synchronization

### **Performance Optimization**

- Use React.memo for expensive components
- Implement proper key props for lists
- Lazy load routes and components
- Optimize bundle size with dynamic imports

---

## 🎨 Styling & UI Guidelines

### **Tailwind CSS Usage**

- Use utility classes for styling
- Follow mobile-first responsive design
- Leverage custom design tokens from tailwind.config.js
- Use CSS custom properties for theming

### **Component Development**

- Build on shadcn/ui components when possible
- Maintain consistent spacing and typography
- Use proper semantic HTML elements
- Ensure accessibility (ARIA labels, keyboard navigation)

### **Design System**

- **Consistent Colors**: Use CSS custom properties
- **Typography Scale**: Follow defined font sizes
- **Spacing**: Use Tailwind spacing scale
- **Icons**: Use Lucide React consistently


---

## 🔧 Configuration Management

### **Environment Variables**

```env
# Required for development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001

# Optional feature flags
NEXT_PUBLIC_ENABLE_AI=true
NEXT_PUBLIC_ENABLE_FILE_UPLOAD=true
NEXT_PUBLIC_ENABLE_VIDEO_CALLS=false
```

### **Path Mapping**

TypeScript is configured with path mapping:

- `~/*` maps to `./src/*`
- Use for cleaner imports across the application
- Example: `import { UserProfile } from '~/types/user';`

---

## Real-time Integration Patterns

### Socket.io + TanStack Query Coordination

The application implements real-time features using Socket.io with direct cache synchronization:

#### Socket Event Handling Pattern

```typescript
// Socket event → API type → UI type → Cache update → UI re-render
socket.on('new_message', (messageAPI: MessageAPI) => {
  // Transform API data to UI format
  const messageUI = chatUtils.messageApiToUi(messageAPI);

  // Update cache for immediate UI response
  chatUtils.addMessageToCache(queryClient, conversationId, messageUI);
});

// Streaming token events
socket.on('token', ({ messageId, token }: { messageId: string; token: string }) => {
  chatUtils.appendTokenToCache(queryClient, conversationId, messageId, token);
});

// Stream completion
socket.on('stream_complete', ({ messageId }: { messageId: string }) => {
  chatUtils.finalizeStreamingMessage(queryClient, conversationId, messageId);
});
```

#### Cache Update Utilities

**Message Insertion:**

```typescript
// utils.ts - Add new message to existing cache
export function addMessageToCache(
  queryClient: QueryClient,
  conversationId: string,
  message: MessageUI
): void {
  queryClient.setQueryData<MessageUI[]>(
    chatKeys.messages(conversationId),
    (oldMessages) => (oldMessages ? [...oldMessages, message] : [message])
  );
}
```

**Token Streaming:**

```typescript
// Real-time token appending for AI responses
export function appendTokenToCache(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  token: string
): void {
  queryClient.setQueryData<MessageUI[]>(
    chatKeys.messages(conversationId),
    (oldMessages) => {
      if (!oldMessages) return oldMessages;

      return oldMessages.map((msg) => {
        if (msg.id === messageId) {
          const tokens = msg.tokens || [];
          return {
            ...msg,
            tokens: [...tokens, token],
            content: msg.content + token,
            isStreaming: true,
          };
        }
        return msg;
      });
    }
  );
}
```

**Stream Completion:**

```typescript
// Mark streaming as complete
export function finalizeStreamingMessage(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string
): void {
  queryClient.setQueryData<MessageUI[]>(
    chatKeys.messages(conversationId),
    (oldMessages) => {
      if (!oldMessages) return oldMessages;

      return oldMessages.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            isStreaming: false,
            syncStatus: 'synced' as const,
          };
        }
        return msg;
      });
    }
  );
}
```

#### Room Management Pattern

```typescript
// Join conversation room for real-time updates
useEffect(() => {
  if (!socket || !conversationId) return;

  socket.emit('join_conversation', conversationId);

  return () => {
    socket.emit('leave_conversation', conversationId);
  };
}, [socket, conversationId]);
```

#### Data Transformation Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Socket    │────│   API Types  │────│ Transformers│────│   UI Types  │
│             │    │              │    │             │    │             │
│ Token stream│───▶│ snake_case   │───▶│ camelCase   │───▶│ TanStack    │
│ Events      │    │ strings      │    │ Date parse  │───▶│ Query Cache │
│ Real-time   │    │              │    │ Status add  │    │ Component   │
└─────────────┘    └──────────────┘    └─────────────┘    │ re-render   │
                                                             └─────────────┘
```

---

## BaseAction Business Logic Layer

### Action Pattern Implementation

The application uses a BaseAction pattern for orchestrating complex business logic:

#### Action Structure

```typescript
// actions/index.ts - Domain actions
export const chatActions = {
  sendMessage: (
    conversationId: string
  ): BaseAction<SendMessagePayload, Promise<void>> => ({
    id: 'chat.sendMessage',
    group: 'chat',
    variant: 'info',

    canPerform: (ctx, payload) => {
      return !!conversationId && payload.content.trim().length > 0;
    },

    perform: async (ctx: BaseActionContext, payload: SendMessagePayload) => {
      // Execute mutation
      await executeMutation(
        ctx.queryClient,
        chatMutations.sendMessage(ctx.queryClient, conversationId),
        payload
      );

      // Clear draft from store
      const state = ctx.store.getState();
      state.clearConversationCache(conversationId);
    },
  }),

  createConversation: (): BaseAction<
    CreateConversationPayload,
    Promise<void>
  > => ({
    id: 'chat.createConversation',
    group: 'chat',
    variant: 'info',

    canPerform: (ctx, payload) => {
      return payload.title.trim().length > 0;
    },

    perform: async (
      ctx: BaseActionContext,
      payload: CreateConversationPayload
    ) => {
      const newConversation = await executeMutation(
        ctx.queryClient,
        chatMutations.createConversation(ctx.queryClient),
        payload
      );

      // Set as active conversation
      const state = ctx.store.getState();
      if (newConversation) {
        state.setActiveConversation(newConversation.id);
      }

      // Navigate to new conversation
      ctx.router.push(`/chats/${newConversation.id}`);
    },
  }),

  bulkDeleteConversations: async (
    conversationIds: string[],
    context: BaseActionContext
  ) => {
    const promises = conversationIds.map(async (conversationId) => {
      await executeMutation(
        context.queryClient,
        chatMutations.deleteConversation(context.queryClient, conversationId),
        { conversationId }
      );

      // Clear cache for each conversation
      const state = context.store.getState();
      state.clearConversationCache(conversationId);
    });

    await Promise.all(promises);
  },
};
```

#### Action Context Interface

```typescript
interface BaseActionContext {
  queryClient: QueryClient;
  store: ChatStore;
  router: NextRouter;
  socket: Socket | null;
}
```

#### Benefits of Action Pattern

- **Validation**: `canPerform` provides pre-execution validation
- **Orchestration**: Complex workflows with multiple steps
- **Error Handling**: Centralized error management and rollback
- **Bulk Operations**: Batch processing with coordinated cache updates
- **Type Safety**: Full TypeScript coverage for actions and payloads

---

## 💻 Code Style Guidelines

## 📚 Resources

- **Main Application README**: [`../README.md`](../README.md)
- **Root Project README**: [`../../README.md`](../../README.md)
- **Architecture Guidelines**: [`../../.agents/rules/architecture.md`](../../.agents/rules/architecture.md)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **React Documentation**: [https://react.dev](https://react.dev)
- **Tailwind CSS**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **TanStack Query**: [https://tanstack.com/query](https://tanstack.com/query)
- **Zustand**: [https://github.com/pmndrs/zustand](https://github.com/pmndrs/zustand)

---

**Remember**: Always follow the domain-driven architecture patterns and maintain clean separation between domains, features, and infrastructure layers.
