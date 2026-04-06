# uvian-web

Main Uvian web application - a modern real-time chat and collaboration platform with conversational messaging, collaborative workspaces (Spaces), account management, notes, posts, assets, and support.

## Tech Stack

| Technology                | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| **Next.js 16**            | React framework (App Router)             |
| **React 19**              | UI library                               |
| **TypeScript**            | Type safety                              |
| **Tailwind CSS**          | Utility-first styling                    |
| **@org/ui**               | Shared shadcn/ui component library       |
| **TanStack Query**        | Server state management                  |
| **Zustand + immer**       | Client state (persisted to localStorage) |
| **Socket.io Client**      | Real-time WebSocket communication        |
| **Supabase Auth**         | Email/password authentication            |
| **React Hook Form + Zod** | Form handling with validation            |

## Directory Structure

```
apps/uvian-web/
├── src/
│   ├── proxy.ts                         # Next.js middleware (auth routing)
│   ├── app/
│   │   ├── layout.tsx                   # Root layout with all providers
│   │   ├── styles.css                   # Global styles (from @org/ui)
│   │   ├── (public)/
│   │   │   └── page.tsx                 # Landing page
│   │   ├── (authenticated)/
│   │   │   ├── layout.tsx               # Full-viewport flex container
│   │   │   ├── home/page.tsx            # Dashboard
│   │   │   ├── chats/                   # Conversations + messages
│   │   │   ├── spaces/                  # Workspaces + notes + posts
│   │   │   ├── accounts/                # Account management
│   │   │   ├── users/                   # User management
│   │   │   ├── settings/page.tsx        # User settings
│   │   │   ├── onboarding/page.tsx      # Profile completion flow
│   │   │   ├── explore/page.tsx         # Coming soon
│   │   │   └── support/                 # FAQ, contact, search
│   │   └── auth/                        # Sign-in, sign-up, confirm, reset
│   ├── components/
│   │   ├── auth/                        # Auth form components
│   │   ├── features/                    # Domain-specific features (12)
│   │   ├── providers/                   # React context providers
│   │   └── shared/                      # Reusable UI components
│   └── lib/
│       ├── actions/                     # BaseAction type system
│       ├── api/                         # API client layer (axios)
│       ├── auth/                        # Auth context + Zod schemas
│       ├── domains/                     # Domain-driven architecture (10)
│       ├── hooks/                       # Shared hooks
│       ├── stores/                      # Zustand store composition
│       └── supabase/                    # Supabase client factories
├── specs/
│   └── index.spec.tsx                   # Landing page test
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Environment Variables

| Variable                               | Purpose              |
| -------------------------------------- | -------------------- |
| `NEXT_PUBLIC_SOCKET_URL`               | WebSocket server URL |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key    |
| `NEXT_PUBLIC_API_URL`                  | Backend API base URL |
| `UVIAN_HUB_API_URL`                    | Uvian Hub API URL    |

## Pages/Routes

### Public

| Route | Description                     |
| ----- | ------------------------------- |
| `/`   | Landing page with feature cards |

### Auth

| Route                   | Description                          |
| ----------------------- | ------------------------------------ |
| `/auth/sign-in`         | Email/password login                 |
| `/auth/sign-up`         | Registration with email confirmation |
| `/auth/confirm-sign-up` | Email verification handler           |
| `/auth/reset-password`  | Password reset request               |

### Authenticated (protected by middleware)

| Route                             | Description                 |
| --------------------------------- | --------------------------- |
| `/home`                           | Dashboard with nav cards    |
| `/chats`                          | Conversations list          |
| `/chats/[conversationId]`         | Individual chat view        |
| `/chats/[conversationId]/members` | Manage conversation members |
| `/spaces`                         | Spaces list                 |
| `/spaces/[spaceId]`               | Space overview              |
| `/spaces/[spaceId]/edit`          | Edit space                  |
| `/spaces/[spaceId]/members`       | Manage space members        |
| `/spaces/[spaceId]/notes`         | Space notes                 |
| `/spaces/[spaceId]/posts`         | Space posts                 |
| `/accounts`                       | Accounts list               |
| `/accounts/[accountId]`           | Account detail              |
| `/accounts/[accountId]/edit`      | Edit account                |
| `/accounts/[accountId]/members`   | Manage account members      |
| `/users`                          | Users list                  |
| `/users/[userId]`                 | User profile                |
| `/users/[userId]/edit`            | Edit user                   |
| `/settings`                       | User settings               |
| `/onboarding`                     | Profile completion flow     |
| `/explore`                        | Coming soon                 |
| `/support`                        | Support hub                 |
| `/support/faq`                    | FAQ browser                 |
| `/support/contact`                | Contact support form        |
| `/support/search`                 | Support search              |

## Architecture

### React Server Components (RSC)

- **Server components by default** - page components are async server components
- **Client components when needed** - auth forms, settings, onboarding use `'use client'`
- **Params unwrapping** - server components use `await params`, client components use `use(params)`

### State Management

| Type         | Solution                                     |
| ------------ | -------------------------------------------- |
| Server state | TanStack Query (2-5 min stale time, retry 3) |
| Client state | Zustand + immer (persisted to localStorage)  |
| Auth state   | React Context (AuthProvider)                 |
| Socket state | React Context (SocketProvider)               |

### Domain-Driven Architecture

Each domain in `lib/domains/[domain]/` follows:

- `api/` - TanStack Query queries.ts and mutations.ts with optimistic updates
- `store/` - Zustand slice (chat, user, spaces, profile)
- `types.ts` - UI types (MessageUI, SpaceUI, etc.)
- `utils.ts` - API-to-UI transformers

### Page Layout System

Consistent compositional pattern:

```
<ModalProvider>
  <PageWrapper>
    <PageWrapperSidebar>
    <PageWrapperContent>
      <PageContainer>
        <PageHeader><Breadcrumb /><PageActions /></PageHeader>
        <PageContent><FeatureInterface /></PageContent>
        <PageModals />
      </PageContainer>
    </PageWrapperContent>
  </PageWrapper>
</ModalProvider>
```

### Action System

Typed `BaseAction<P, O>` pattern with `canPerform()` guards and `perform()` execution. Context includes queryClient, store, router.

### Real-Time Messaging

Socket.io with Supabase token auth. Events: `join_conversation`, `send_message`, `new_message`, `conversation_updated`. Supports streaming tokens with `isDelta`/`isComplete`.

### Profile Types

`human` | `agent` | `system` | `admin`

## Commands

```bash
# Serve (development)
npx nx serve uvian-web

# Build
npx nx build @org/uvian-web

# Test
npx nx test @org/uvian-web

# Lint
npx nx lint @org/uvian-web

# Typecheck
npx nx typecheck @org/uvian-web
```

## Deployment

Deployed on **Railway**.

- **Start command:** `npx nx run @org/uvian-web:start`
- **Health check:** `GET /` (60s timeout)
- **Restart policy:** `on_failure` (production), `always` (staging)
- **Watch patterns:** `apps/uvian-web/**`, `packages/ui/**`, `nx.json`, `package.json`, `package-lock.json`, `tsconfig.base.json`
