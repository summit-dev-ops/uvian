# Uvian Intake Web - Product Guide

## Overview

**Uvian Intake Web** is a Next.js-based public intake form renderer within the Uvian Agent Collaboration & Orchestration Platform. This application serves as the secure, external-facing interface for collecting user-submitted information through dynamically generated forms. It enables agents and workflows to request sensitive data from users via secure, encrypted links that can be shared through any channel.

### What Is This App?

Uvian Intake Web is the public-facing form renderer that:

- Renders dynamic intake forms based on schema configurations received from the backend API
- Provides secure, encrypted data submission for sensitive information collection
- Supports optional authentication for restricted form access
- Delivers a polished, accessible user experience for form completion

This application is designed to be embedded or linked from any context—conversations, emails, or external systems—allowing Uvian agents to REQUEST information from users in a controlled, secure manner.

### Key Value Proposition

For end users, Uvian Intake Web provides:

- **Security**: End-to-end encryption ensures sensitive data is protected during transmission
- **Convenience**: Simple, clean form interface accessible via secure link
- **Trust**: Clear indicators that the form is legitimate and secure
- **Accessibility**: No account required for open forms; optional authentication for personalized experience

For organizations and agents, it provides:

- **Flexibility**: Dynamically rendered forms without code changes
- **Compliance**: Audit trails and encryption for data sensitivity
- **Integration**: Seamless embedding in any communication channel

---

## User Experience and Workflows

### Primary User Flow: Form Submission

1. **User receives a secure link**
   - The link is shared via conversation, email, or other channel
   - Format: `https://intake.uvian.com/t/int_<tokenId>`

2. **User opens the link**
   - The application validates the token and fetches the form schema
   - Displays the form with title, description, and fields

3. **Form completion**
   - For open forms: User fills in fields and submits
   - For authenticated forms: User signs in/up first, then completes form

4. **Submission confirmation**
   - Success page displays after encryption and submission
   - User is informed their data has been securely submitted

### Authentication Flow

For forms that require authentication (`requiresAuth: true`):

1. User sees sign-in/sign-up prompt first
2. Option to sign in with existing account or create new account
3. After authentication, the form renders
4. User completes and submits the form

This flow ensures that form responses can be tied to a user identity while maintaining the simplicity of a link-based access model.

### Error Flow: Expired Links

If a token is expired, revoked, or already used:

- User sees a clear "Link Expired" message
- Instructions to request a new link from the conversation

---

## Technical Architecture

### Framework and Key Libraries

| Category | Technology | Purpose |
|----------|------------|---------|
| Framework | Next.js 14+ | React server components, file-based routing |
| UI Components | @org/ui | Shared design system components |
| Form Management | React Hook Form | Form state and validation |
| Validation | Zod | Schema validation for dynamic forms |
| HTTP Client | Axios | API communication |
| Auth Provider | Supabase Auth | User authentication flows |
| Query Management | TanStack Query | Server state and mutation handling |
| Styling | Tailwind CSS | Utility-first styling (via @org/ui) |
| Encryption | Web Crypto API | Client-side RSA/AES encryption |

### File Structure

```
apps/uvian-intake-web/src/
├── app/
│   ├── page.tsx                      # Health check page
│   ├── success/page.tsx              # Submission success page
│   ├── expired/page.tsx             # Token expired error page
│   ├── t/[tokenId]/page.tsx         # Dynamic form renderer (main route)
│   ├── layout.tsx                    # Root layout
│   └── styles.css                  # Global styles
├── components/
│   ├── intake-form-container.tsx     # Form container with auth logic
│   ├── dynamic-form.tsx             # Dynamic form renderer
│   ├── providers.tsx                # React Query provider wrapper
│   ├── providers/
│   │   └── auth-provider.tsx        # Auth context provider wrapper
│   └── auth/
│       ├── sign-in-form.tsx         # Sign in form component
│       └── sign-up-form.tsx          # Sign up form component
└── lib/
    ├── api/
    │   ├── intake.ts               # Intake API client functions
    │   └── types.ts              # TypeScript interfaces
    ├── auth/
    │   └── auth-context.tsx      # Authentication context
    ├── schemas/
    │   └── intake.schema.ts     # Zod schema builder for dynamic forms
    ├── supabase/
    │   └── client.ts           # Supabase client factory
    └── crypto.ts              # Client-side encryption utilities
```

### Pages and Routes

| Route | Description |
|-------|-------------|
| `/` | Health check page - confirms the application is operational |
| `/t/[tokenId]` | Main dynamic form route - renders intake form by token |
| `/success` | Displayed after successful form submission |
| `/expired` | Displayed when token is expired or invalid |

The primary route is `/t/[tokenId]`, where `tokenId` must start with `int_` (e.g., `int_abc123DEF456`).

### Key Components

#### IntakeFormContainer

The container component that handles:

- Auth state management
- Auth mode switching (sign-in vs. sign-up)
- Conditional rendering based on auth requirements
- Loading states

#### DynamicForm

The core form component that:

- Builds a Zod schema from the intake field definitions
- Renders appropriate inputs for each field type
- Handles form submission with encryption
- Provides validation feedback

Supported field types:

| Type | UI Component |
|------|---------------|
| `text` | Input (text) |
| `email` | Input (email) |
| `password` | Input (password) |
| `textarea` | Textarea |
| `select` | Select with options |

#### Encryption (crypto.ts)

Client-side hybrid encryption using:

- **AES-256-GCM** for payload encryption
- **RSA-OAEP** for key encryption
- Process: Generate AES key → Encrypt payload → Encrypt AES key with public key

### State Management Approach

| State Type | Solution | Usage |
|------------|----------|-------|
| Server state | TanStack Query | API calls for schema and submission |
| Form state | React Hook Form | Form input management |
| Auth state | Supabase Auth + Context | User session management |
| Server components | Next.js RSC | Initial data fetching |

---

## API Integrations

### Backend API Consumed

The application consumes the **Intake API** (uvian-intake-api) at `NEXT_PUBLIC_INTAKE_API_URL` (defaults to `http://localhost:8001`):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/public/intakes/{tokenId}` | GET | Fetch intake form schema |
| `/api/public/intakes/{tokenId}/status` | GET | Check intake status (pending/completed/revoked/expired) |
| `/api/public/intakes/{tokenId}/submit` | POST | Submit form data |

### Authentication

Supabase Auth is integrated for:

- User sign-in (email + password)
- User sign-up (email + password)
- Session management

Required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_INTAKE_API_URL
```

---

## Integration Points

### Dynamic Form Schema

Forms are defined by a JSON schema fetched from the backend:

```typescript
interface IntakeSchema {
  title: string;
  description?: string;
  submitLabel?: string;
  publicKey: string;           // RSA public key for encryption
  requiresAuth?: boolean;    // Whether auth is required
  schema: {
    fields: IntakeField[];
  };
}

interface IntakeField {
  name: string;
  type: 'text' | 'password' | 'email' | 'select' | 'textarea';
  label: string;
  required?: boolean;
  options?: { value: string; label: string }[];  // For select fields
  placeholder?: string;
  secret?: boolean;                            // Whether field is sensitive
}
```

### Form Lifecycle

1. **Token Generation**: Backend creates intake token with schema and expiration
2. **Token Validation**: Frontend validates token format on load
3. **Schema Fetch**: Application fetches schema from backend
4. **Form Render**: Dynamic form builds from schema fields
5. **Encryption**: Sensitive fields encrypted client-side before submission
6. **Submission**: Encrypted payload sent to backend
7. **Confirmation**: Success page displayed

### Key Behavioral Details

- **Token Format**: Must start with `int_` prefix
- **Error Handling**: Invalid tokens → 404; Expired tokens → `/expired`
- **Encryption**: Hybrid AES+RSA encryption for all submissions when publicKey provided
- **Auth Flow**: Sign-in/sign-up toggles within same component, no page navigation
- **Success Flow**: Redirects to `/success` on completion
- **Failure Flow**: Redirects to `/expired` on submission error (for security, avoid leaking details)

---

## Security Considerations

### Client-Side Encryption

All form data is encrypted client-side using hybrid encryption before transmission:

1. **AES-256-GCM** encrypts the form payload
2. **RSA-OAEP** encrypts the AES key
3. Both encrypted payload and encrypted key are sent to the server

This ensures that even if the transport is compromised, the data remains protected.

### Token Security

- Tokens are validated server-side on each request
- Expired or revoked tokens redirect to error page
- Token format validation prevents directory traversal attempts

### Authentication

- Supabase Auth handles user credentials securely
- Sessions are managed via HttpOnly cookies
- Password requirements: Minimum 8 characters

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | - | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | - | Supabase anon key |
| `NEXT_PUBLIC_INTAKE_API_URL` | No | `http://localhost:8001` | Backend API URL |

### Dependencies

Core dependencies are provided by the monorepo:

- `@org/ui` - Shared UI component library
- `@supabase/ssr` - Supabase client for server/browser environments
- `@tanstack/react-query` - Query and mutation state
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `axios` - HTTP client

---

## How It Fits Into the Platform

Uvian Intake Web is one of five applications in the Uvian monorepo:

| Application | Purpose |
|--------------|---------|
| `uvian-web` | Main user dashboard and collaboration interface |
| `uvian-hub-api` | Core API for agent and workflow management |
| `uvian-automation-worker` | Background job processing |
| `uvian-intake-web` | Public form renderer (this app) |
| `uvian-intake-api` | Backend for intake form management |

The intake system enables:

1. **Agents** to REQUEST information from users via secure links
2. **Workflows** to collect data as part of automated processes
3. **Users** to submit sensitive information securely without exposing it in conversations

This decouples data collection from the main conversation, improving security and user experience.

---

## Development Commands

```bash
# Build
npx nx build uvian-intake-web

# Development server
npx nx serve uvian-intake-web

# Lint
npx nx lint uvian-intake-web

# Typecheck
npx nx typecheck uvian-intake-web
```

The application runs on port 3001 (or the next available port) in development.

---

## Summary

Uvian Intake Web provides a secure, dynamic form rendering experience for the Uvian platform. It enables agents to collect sensitive user information through encrypted, link-based forms while maintaining a clean, accessible interface. With support for optional authentication, multiple field types, and client-side encryption, it serves as a critical integration point for data collection in automated workflows.
