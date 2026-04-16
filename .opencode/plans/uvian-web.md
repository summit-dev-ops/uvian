# Uvian Web Application

## Product Guide

Uvian Web is the primary frontend application for the Uvian platform—an Agent Collaboration & Orchestration Platform. This Next.js-based web application serves as the main user interface where users interact with Uvian's collaborative features, manage AI agents, and participate in conversations and workspaces.

---

## Table of Contents

1. [What is Uvian Web?](#what-is-uvian-web)
2. [Key Features and Capabilities](#key-features-and-capabilities)
3. [User Value Proposition](#user-value-proposition)
4. [Key User Workflows](#key-user-workflows)
5. [Platform Integration](#platform-integration)
6. [Technical Architecture](#technical-architecture)
7. [Pages and Routes](#pages-and-routes)
8. [Domain Model](#domain-model)
9. [State Management](#state-management)
10. [API Integrations](#api-integrations)
11. [Real-time Capabilities](#real-time-capabilities)

---

## What is Uvian Web?

Uvian Web is a modern, full-featured web application built on Next.js that provides the graphical interface for Uvian's Agent Collaboration & Orchestration Platform. It enables users to:

- Authenticate and manage their accounts
- Participate in real-time AI-powered conversations
- Create and manage collaborative workspaces (Spaces)
- Create and share content (Posts, Notes)
- Upload and manage digital assets
- Configure AI agent profiles
- Access support resources

The application follows a modular, domain-driven architecture that separates concerns into distinct functional areas: Chat, Spaces, Users, Accounts, Posts, Notes, Assets, and Support.

---

## Key Features and Capabilities

### Authentication and User Management

Uvian Web provides complete authentication flows through Supabase integration:

| Feature | Description |
|---------|-------------|
| Email Sign-In | Password-based authentication using email credentials |
| Email Sign-Up | New user registration with email verification |
| Password Reset | Self-service password recovery flow |
| Email Confirmation | Account verification via confirmation links |
| Session Management | Automatic session handling with token refresh |

The authentication system uses React Hook Form with Zod validation schemas for type-safe form handling.

### Conversations and Chat

The Chat domain is a core feature enabling real-time communication with AI agents:

| Capability | Details |
|------------|---------|
| Conversation Management | Create, list, and manage chat conversations |
| Real-time Messaging | WebSocket-powered real-time message delivery |
| Message Types | Support for user, assistant, and system messages |
| Attachments | Rich message attachments including mentions, files, and links |
| Streaming Responses | Real-time token streaming for AI responses |
| Member Management | Conversation participant roles (owner, admin, member) |

### Spaces (Collaborative Workspaces)

Spaces are collaborative environments for teams and organizations:

| Feature | Description |
|---------|-------------|
| Space Creation | Create private or public workspaces |
| Member Management | Invite users with roles (owner, admin, member) |
| Space Settings | Customizable space configurations |
| Content Sharing | Share posts within spaces |
| Notes | Create and manage notes within spaces |
| Statistics | View space analytics and member counts |

### Content Management

The platform supports multiple content types through the Posts domain:

| Content Type | Description |
|--------------|-------------|
| Note Posts | Markdown-style text notes with rich content |
| Asset Posts | Posts containing uploaded files and media |
| External Posts | Links to external content or resources |

### Asset Management

A comprehensive file management system:

| Capability | Details |
|------------|---------|
| File Upload | Drag-and-drop upload zone |
| Asset Picker | Dialog-based asset selection |
| Preview Support | Image and document previews |
| Type Filtering | Filter by asset type (image, text, document) |
| Storage Backends | Supabase storage integration |

### User Profiles

User profile management supporting different profile types:

| Profile Type | Description |
|--------------|-------------|
| Human | Regular user profiles |
| Agent | AI agent profiles with configuration |
| System | System-level profiles |
| Admin | Administrator profiles |

### Onboarding Flow

Guided user onboarding experience:

- Profile setup wizard
- Step-by-step navigation
- Progress tracking
- Skip functionality for experienced users
- Automatic redirection on completion

### Support Dashboard

Integrated support functionality:

| Feature | Description |
|---------|-------------|
| FAQ Section | searchable Frequently Asked Questions |
| Contact Support | Ticket submission system |
| Search | Support content search |
| Category Browsing | Browse by support category |

---

## User Value Proposition

### For End Users

1. **Unified Collaboration Hub**: Access all collaboration tools—chat, spaces, content, and assets—from a single application
2. **AI-Powered Conversations**: Engage with AI agents in real-time for assistance, automation, and knowledge retrieval
3. **Seamless Experience**: Intuitive interface with modern UX patterns (dark mode, responsive design)
4. **Flexible Workspaces**: Create private spaces for teams or public spaces for community collaboration
5. **Rich Content Sharing**: Share notes, files, and external links within collaborative contexts

### For Teams and Organizations

1. **Multi-User Spaces**: Collaborative workspaces with role-based access control
2. **Account Management**: Organize users under accounts with customizable settings
3. **Content Governance**: Control what content is shared and with whom

### For AI Agent Developers

1. **Agent Configuration**: Configure and manage AI agent profiles
2. **Integration Ready**: Backend APIs consume agent configurations for AI behavior

---

## Key User Workflows

### Authentication Workflow

```
1. User visits landing page (/)
2. Clicks "Sign In" or "Get Started"
3. Redirected to /auth/sign-in
4. Enters email/password
5. System authenticates via Supabase
6. On success: redirect to /home
7. On failure: display error message
```

### Conversation Workflow

```
1. User navigates to /chats
2. Views list of conversations or creates new
3. Selects conversation to open
4. Views message history
5. Types message and sends
6. AI responds (streaming tokens)
7. Real-time via WebSocket
```

### Space Collaboration Workflow

```
1. User navigates to /spaces
2. Creates new space or selects existing
3. Views space details, members, posts
4. Adds members with roles
5. Creates posts (notes, assets, external)
6. Notes available at /spaces/[spaceId]/notes
```

### Onboarding Workflow

```
1. New user logs in
2. If profile incomplete, redirected to /onboarding
3. Completes profile setup wizard
4. Progress saved automatically
5. On completion: redirect to /home
```

---

## Platform Integration

### Role in Architecture

Uvian Web is the presentation layer in a multi-service architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Uvian Platform                      │
├─────────────────────────────────────────────���─��─────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │  uvian-web  │───▶│ uvian-hub-api │                  │
│  │  (Next.js) │    │   (Fastify)   │                  │
│  └──────────────┘    └──────────────┘                  │
│         │                    │                            │
│         ▼                    ▼                            │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │  Supabase   │    │   Supabase   │                  │
│  │  (Auth/DB)  │    │   (Database) │                  │
│  └──────────────┘    └──────────────┘                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Service Dependencies

| Service | Purpose | Integration |
|---------|---------|------------|
| uvian-hub-api | REST API backend | Axios HTTP client |
| Supabase Auth | User authentication | Supabase client |
| Supabase Storage | File storage | Supabase client |
| Socket Server | Real-time messaging | Socket.io client |

---

## Technical Architecture

### Framework and Libraries

| Technology | Purpose |
|------------|---------|
| Next.js 14+ | React framework with App Router |
| TypeScript | Type-safe development |
| React 18+ | UI component library |
| Tailwind CSS | Styling utility |
| @org/ui | Shared UI component library |
| TanStack Query | Server state management |
| Zustand | Client state management |
| React Hook Form | Form handling |
| Zod | Schema validation |
| Socket.io Client | Real-time communication |
| Lucide React | Icon library |

### Project Structure

```
apps/uvian-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (authenticated)/    # Protected routes
│   │   │   ├── home/
│   │   │   ├── chats/
│   │   │   ├── spaces/
│   │   │   ├── users/
│   │   │   ├── accounts/
│   │   │   ├── settings/
│   │   │   ├── onboarding/
│   │   │   └── support/
│   │   ├── (public)/         # Public routes
│   │   │   └── page.tsx      # Landing page
│   │   └── auth/             # Authentication routes
│   ├── components/            # React components
│   │   ├── auth/            # Auth forms
│   │   ├── features/        # Feature components
│   │   │   ├── chat/
│   │   │   ├── spaces/
│   │   │   ├── posts/
│   │   │   ├── assets/
│   │   │   ├── user/
│   │   │   ├── onboarding/
│   │   │   ├── support/
│   │   │   └── explore/
│   │   ├── providers/       # Context providers
│   │   └── shared/          # Shared UI components
│   └── lib/                    # Application logic
│       ├── api/             # API client factory
│       ├── auth/            # Authentication utilities
│       ├── domains/         # Domain models
│       │   ├── chat/
│       │   ├── spaces/
│       │   ├── posts/
│       │   ├── notes/
│       │   ├── assets/
│       │   ├── user/
│       │   ├── profile/
│       │   ├── accounts/
│       │   └── support/
│       ├── hooks/            # Custom React hooks
│       ├── stores/          # Zustand stores
│       └── supabase/        # Supabase clients
└── package.json
```

### App Router Structure

The application uses Next.js 14+ App Router with route groups:

- `(authenticated)` - Routes requiring authentication
- `(public)` - Publicly accessible routes
- `auth/` - Authentication-specific routes

---

## Pages and Routes

### Public Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | LandingPage | Public landing/landing page |
| `/auth/sign-in` | SignInPage | Email/password sign-in |
| `/auth/sign-up` | SignUpPage | User registration |
| `/auth/reset-password` | ResetPasswordPage | Password recovery |
| `/auth/confirm-sign-up` | ConfirmSignUpPage | Email confirmation |

### Authenticated Routes

| Route | Page | Description |
|-------|------|-------------|
| `/home` | HomePage | Main dashboard |
| `/chats` | ConversationsPage | List all conversations |
| `/chats/[conversationId]` | ConversationPage | View/chat in conversation |
| `/chats/[conversationId]/members` | ConversationMembersPage | Conversation members |
| `/spaces` | SpacesPage | List all spaces |
| `/spaces/[spaceId]` | SpacePage | Space details |
| `/spaces/[spaceId]/edit` | SpaceEditPage | Edit space |
| `/spaces/[spaceId]/members` | SpaceMembersPage | Space members |
| `/spaces/[spaceId]/posts` | SpacePostsPage | Space posts |
| `/spaces/[spaceId]/notes` | SpaceNotesPage | Space notes |
| `/spaces/[spaceId]/notes/[noteId]` | NoteDetailPage | Note details |
| `/users` | UsersPage | List users |
| `/users/[userId]` | UserProfilePage | User profile |
| `/users/[userId]/edit` | UserProfileEditPage | Edit profile |
| `/accounts` | AccountsPage | List accounts |
| `/accounts/[accountId]` | AccountPage | Account details |
| `/accounts/[accountId]/edit` | AccountEditPage | Edit account |
| `/accounts/[accountId]/members` | AccountMembersPage | Account members |
| `/settings` | SettingsPage | User settings |
| `/onboarding` | OnboardingPage | New user onboarding |
| `/explore` | ExplorePage | Explore (coming soon) |
| `/support` | SupportPage | Support hub |
| `/support/faq` | FAQPage | FAQ section |
| `/support/contact` | ContactSupportPage | Contact support |
| `/support/search` | SupportSearchPage | Search support |

---

## Domain Model

### Core Domain Types

#### Chat Domain

```typescript
// Conversation - A chat thread
type ConversationUI = {
  id: string;           // UUID
  title: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'error';
  lastMessage?: MessageUI;
}

// Message - A single message in a conversation
type MessageUI = {
  id: string;           // UUID
  conversationId: string;
  senderId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
  syncStatus: 'synced' | 'pending' | 'error';
  isStreaming?: boolean;
  tokens?: string[];
  senderProfile?: ProfileUI;
  attachments?: Attachment[];
}

// Conversation Member - Participant in a conversation
type ConversationMemberUI = {
  userId: string;
  conversationId: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
  syncStatus: DataSyncStatus;
  profile?: ProfileUI;
}
```

#### Spaces Domain

```typescript
// Space - Collaborative workspace
type SpaceUI = {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  avatarUrl?: string;
  createdBy: string;
  settings: Record<string, any>;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  conversationCount?: number;
  userRole?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
}

// Space Member - Participant in a space
type SpaceMemberUI = {
  spaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  profile?: ProfileUI;
}
```

#### User and Profile Domain

```typescript
// Profile - User profile data
type ProfileUI = {
  id: string;
  userId: string;
  type: 'human' | 'agent' | 'system' | 'admin';
  displayName: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string | null;
  agentConfig?: any;
  publicFields: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// User Search Result
type UserSearchResult = {
  userId: string;
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  type: 'human' | 'agent';
}
```

#### Content Domains

```typescript
// Post - Content shared in a space
type PostUI = {
  id: string;
  spaceId: string;
  userId: string;
  contents: PostContent[];
  createdAt: string;
  updatedAt: string;
  authorProfile?: ProfileUI;
}

type PostContent = {
  id: string;
  contentType: 'note' | 'asset' | 'external';
  noteId: string | null;
  assetId: string | null;
  url: string | null;
}

// Note - Text content
type NoteUI = {
  id: string;
  spaceId: string;
  ownerUserId: string;
  title: string;
  body: string | null;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  ownerProfile?: ProfileUI;
}

// Asset - Uploaded file
type AssetUI = {
  id: string;
  accountId: string;
  uploaderUserId: string | null;
  type: 'image' | 'text' | 'document';
  url: string;
  filename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  storageType: 'supabase' | 'external';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

#### Support Domain

```typescript
// FAQ Item
type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

// Support Ticket
type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'technical' | 'billing' | 'feature-request' | 'bug-report';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
```

#### Accounts Domain

```typescript
// Account - Organization/account
type AccountUI = {
  id: string;
  name: string | null;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Account Member
type AccountMemberUI = {
  id: string;
  accountId: string;
  userId: string;
  role: {
    name: string;
    permissions?: string[];
  };
  createdAt: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string;
}
```

### Attachment Types

Shared across domains for rich content:

```typescript
type MentionAttachment = {
  type: 'mention';
  key: string;
  userId: string;
  label: string;
}

type FileAttachment = {
  type: 'file';
  key: string;
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
}

type LinkAttachment = {
  type: 'link';
  key: string;
  url: string;
}

type Attachment = MentionAttachment | FileAttachment | LinkAttachment;
```

---

## State Management

### Server State (TanStack Query)

The application uses TanStack Query for server state with query keys and query options pattern:

```typescript
// Example: Chat queries
import { chatQueries } from '~/lib/domains/chat/api/queries';

const { data: conversations } = useQuery(chatQueries.conversations());
const { data: messages } = useQuery(chatQueries.messages(conversationId));
```

Each domain has:
- **Query Keys**: Unique keys for cache management
- **Query Options**: Pre-configured queryOptions for fetching
- **Mutations**: Mutation functions with client updates

### Client State (Zustand)

Zustand stores manage client-side state with persist middleware:

```typescript
// App Store structure
import { createAppStore } from '~/lib/stores/app-store/app-store';

const store = createAppStore();
const { hasHydrated, ...slice } = store.getState();

// Slices include:
- Chat slice: conversation composition, mode
- User slice: current user data
- Spaces slice: selected space, cache
- Profile slice: profile draft
```

Store structure:

```typescript
type AppState = {
  // Hydration
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Chat slice
  composition: ConversationComposition;
  mode: ConversationMode;
  setComposition: (composition) => void;
  setMode: (mode) => void;
  
  // User slice
  currentUser: User | null;
  setCurrentUser: (user) => void;
  
  // Spaces slice
  spaces: SpaceUI[];
  selectedSpaceId: string | null;
  setSpaces: (spaces) => void;
  setSelectedSpaceId: (id) => void;
  
  // Profile slice
  profileDraft: ProfileDraft | null;
  setProfileDraft: (draft) => void;
};
```

### Provider Stack

The application wraps components with a provider hierarchy:

```
ThemeProvider
  └── QueryProvider
    └── StoreProvider
      └── AuthProvider
        └── SocketProvider
```

| Provider | Package | Role |
|----------|---------|------|
| ThemeProvider | next-themes | Dark/light mode |
| QueryProvider | @tanstack/react-query | Server state |
| StoreProvider | zustand | Client state |
| AuthProvider | custom | Authentication context |
| SocketProvider | socket.io-client | Real-time connections |

---

## API Integrations

### Backend Communication

Uvian Web communicates with the **uvian-hub-api** backend (Fastify server):

```typescript
// API Client Factory
import { createApiClient } from '~/lib/api/api-factory';

const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL);

// Interceptors
- Request: Adds Authorization Bearer token from Supabase session
- Response: Handles 401 errors
```

### REST API Endpoints Consumed

| Domain | Endpoints |
|--------|----------|
| Chat | GET/POST `/api/conversations`, GET `/api/conversations/:id`, GET `/api/conversations/:id/messages` |
| Spaces | GET/POST `/api/spaces`, GET `/api/spaces/:id`, GET `/api/spaces/:id/members` |
| Posts | GET `/api/spaces/:id/posts`, POST `/api/spaces/:id/posts` |
| Notes | GET `/api/spaces/:id/notes`, POST `/api/spaces/:id/notes` |
| Assets | GET `/api/assets`, POST `/api/assets/upload` |
| Users | GET `/api/users`, GET `/api/users/:id` |
| Accounts | GET `/api/accounts`, GET `/api/accounts/:id/members` |
| Support | GET `/api/support/faq`, POST `/api/support/contact` |

### Supabase Integration

```typescript
// Supabase Client (browser)
import { createClient } from '~/lib/supabase/client';

// Supabase Server (server components)
import { createServerClient } from '~/lib/supabase/server';

// Used for:
- Authentication (signInWithPassword, signUp, etc.)
- Database queries
- File storage (assets)
- Session management
```

### Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

---

## Real-time Capabilities

### WebSocket Integration

The application uses Socket.io for real-time features:

```typescript
// Socket Provider
import { SocketProvider, useSocket } from '~/components/providers/socket';

const { socket, isConnected } = useSocket();
```

### Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `message` | Server → Client | New message in conversation |
| `token` | Server → Client | Streaming token for AI response |
| `conversation_update` | Server → Client | Conversation metadata change |

### Socket Message Types

```typescript
type SocketMessageEvent = {
  conversationId: string;
  message: MessageUI;
  isDelta?: boolean;
  isComplete?: boolean;
};

type SocketTokenEvent = {
  conversationId: string;
  messageId: string;
  token: string;
  isComplete: boolean;
};

type SocketConversationUpdateEvent = {
  conversationId: string;
  title?: string;
};
```

---

## Summary

Uvian Web is a comprehensive, modern React application that provides the complete user interface for the Uvian Agent Collaboration & Orchestration Platform. Built on Next.js 14+ with App Router, it offers:

- **Authentication**: Full Supabase integration with email/password auth
- **Chat**: Real-time AI-powered conversations with WebSocket streaming
- **Spaces**: Collaborative workspaces with member management
- **Content**: Rich content sharing (posts, notes, assets)
- **Profiles**: User and agent profile management
- **Support**: Integrated help and ticket system

The application follows established best practices with TanStack Query for server state, Zustand for client state, and modular domain-driven architecture. It integrates seamlessly with the uvian-hub-api backend and Supabase services to deliver a complete collaborative platform experience.
