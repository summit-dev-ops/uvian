# Uvian Web - Next.js Frontend Application

[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Uvian Web** is the frontend application of the Uvian real-time chat platform, built with Next.js 16 and React 19. It provides a modern, responsive user interface with real-time messaging capabilities, AI integration, and enterprise-grade user experience.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Running `uvian-api` service (http://localhost:3001)
- Supabase project setup

### Installation & Development

```bash
# From the workspace root
nx serve uvian-web

# Or navigate to app directory
cd apps/uvian-web
npm run dev

# Access the application
open http://localhost:3000
```

### Building for Production

```bash
# Build the application
nx build uvian-web

# Start production build locally
nx start uvian-web
```

---

## 🏗️ Architecture Overview

### **Technology Stack**

| Technology           | Version | Purpose                              |
| -------------------- | ------- | ------------------------------------ |
| **Next.js**          | 16      | React framework with App Router      |
| **React**            | 19      | UI library with latest features      |
| **TypeScript**       | 5.9+    | Type safety and developer experience |
| **Tailwind CSS**     | 3.4+    | Utility-first styling framework      |
| **Zustand**          | Latest  | Client-side state management         |
| **TanStack Query**   | Latest  | Server state management              |
| **React Hook Form**  | Latest  | Form handling and validation         |
| **Zod**              | Latest  | Schema validation                    |
| **Socket.io Client** | Latest  | Real-time communication              |
| **Supabase Auth**    | Latest  | Authentication and user management   |

### **Application Structure**

```
src/
├── app/                    # Next.js App Router
│   ├── (authenticated)/    # Protected routes group
│   │   ├── chats/          # Chat interface pages
│   │   ├── profiles/        # User profile management
│   │   ├── settings/       # Application settings
│   │   └── spaces/         # Team spaces functionality
│   ├── auth/               # Authentication pages
│   │   ├── sign-in/        # User login
│   │   ├── sign-up/        # User registration
│   │   ├── reset-password/ # Password reset
│   │   └── confirm-sign-up/# Email verification
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Home/landing page
├── components/             # React components
│   ├── auth/               # Authentication components
│   ├── features/           # Feature-based components
│   │   ├── chat/           # Chat feature components
│   │   ├── spaces/         # Spaces feature components
│   │   └── user/           # User management components
│   ├── providers/          # Context providers
│   │   ├── query/          # TanStack Query provider
│   │   ├── socket/         # Socket.io provider
│   │   ├── store/          # Zustand store provider
│   │   └── theme/          # Theme provider
│   ├── shared/             # Shared utility components
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities and configurations
│   ├── auth/               # Authentication utilities
│   ├── domains/            # Domain-driven architecture
│   │   ├── chat/           # Chat domain (api, store, actions)
│   │   ├── spaces/         # Spaces domain
│   │   └── user/           # User domain
│   ├── stores/             # Zustand store definitions
│   ├── supabase/           # Supabase client configuration
│   └── hooks/              # Custom React hooks
└── public/                 # Static assets
```

### **Domain-Driven Architecture**

The application follows a strict domain-driven architecture with clear separation:

#### **Domain Structure**

```
lib/domains/[domain]/
├── api/                 # TanStack Query queries & mutations
├── store/               # Zustand store slices
├── types.ts            # Domain-specific types
└── utils.ts            # Data transformers (apiToUi)
```

#### **Feature Layer**

```
components/features/[feature]/
├── hooks/              # Feature orchestrators
├── components/         # UI components
├── index.ts            # Public feature API
└── types.ts            # Feature-specific types
```

---

## 📋 Core Features

### **🔐 Authentication System**

#### **Authentication Pages**

- `/auth/sign-in` - User login with email/password
- `/auth/sign-up` - User registration with email confirmation
- `/auth/reset-password` - Password reset functionality
- `/auth/confirm-sign-up` - Email verification handling

#### **Auth Features**

- Supabase Auth integration
- Session management with automatic refresh
- Protected route middleware
- Social login ready (configurable)

### **💬 Real-time Chat Interface**

#### **Chat Features**

- **Real-time messaging** with Socket.io
- **AI-powered responses** with streaming support
- **Message threading** and conversation history
- **File sharing** and media support
- **Typing indicators** and presence status
- **Message search** and filtering

#### **Chat Routes**

- `/chats` - Conversation list and management
- `/chats/[id]` - Individual chat interface
- `/chats/[id]/members` - Chat participant management

### **🏢 Team Workspaces (Spaces)**

#### **Space Management**

- Create and manage team workspaces
- Role-based access control (owner, admin, member, guest)
- Space-specific conversations
- Member management and permissions

#### **Space Routes**

- `/spaces` - Workspace browser and management
- `/spaces/[id]` - Individual workspace view
- `/spaces/[id]/edit` - Workspace configuration
- `/spaces/[id]/members` - Member management

### **👤 User Management**

#### **Profile Features**

- Profile viewing and editing
- Avatar upload and management
- Preference settings
- Account management

#### **Profile Routes**

- `/profiles/[profileId]/edit` - Profile viewing
- `/profiles/[profileId]/edit` - Profile editing interface
- `/settings` - Application settings and preferences

### **📱 Responsive Design**

#### **Mobile-First Approach**

- Responsive design for all screen sizes
- Touch-friendly interactions
- Progressive Web App (PWA) ready
- Offline capability considerations

#### **UI Components**

- shadcn/ui component library
- Custom design system
- Dark/light theme support
- Accessibility compliant (WCAG 2.1)

---

## 🛠️ Development Commands

### **Core Commands**

```bash
# Development server
nx serve uvian-web

# Build for production
nx build uvian-web

# Start production build
nx start uvian-web

# Run tests
nx test uvian-web

# Type checking
nx typecheck uvian-web

# Linting
nx lint uvian-web
```

### **Testing**

```bash
# Run all tests
nx test uvian-web

# Run tests in watch mode
nx test uvian-web --watch

# Run tests with coverage
nx test uvian-web --coverage

# Run specific test file
nx test uvian-web --testPathPattern=components
```

### **Code Quality**

```bash
# Lint with auto-fix
nx lint uvian-web --fix

# Format code
npm run format

# Type check
nx typecheck uvian-web
```

---

## 🎨 Design System

### **Tailwind Configuration**

The application uses a custom Tailwind configuration with:

- **Custom Color Palette**: CSS custom properties for theming
- **Extended Animations**: Custom keyframes and transitions
- **Dark Mode Support**: CSS variable-based theming
- **Component Integration**: Optimized for shadcn/ui components

### **UI Component Library**

#### **shadcn/ui Components**

- Built on Radix UI primitives
- Accessible and customizable
- Consistent design language
- Type-safe component APIs

#### **Custom Components**

- Business-specific components
- Domain-driven component organization
- Reusable across features
- Consistent styling patterns

### **Icon System**

- **Lucide React**: Consistent icon library
- **Custom Icons**: Domain-specific icons
- **Icon Components**: Type-safe icon usage
- **Theming Support**: Icon color theming

---

## 🔧 Configuration

### **Environment Variables**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_AI=true
NEXT_PUBLIC_ENABLE_FILE_UPLOAD=true
```

### **Key Configuration Files**

| File                 | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `next.config.js`     | Next.js configuration with Nx integration  |
| `tailwind.config.js` | Tailwind CSS with custom design tokens     |
| `tsconfig.json`      | TypeScript configuration with path mapping |
| `postcss.config.js`  | PostCSS configuration for Tailwind         |
| `components.json`    | shadcn/ui component library configuration  |

### **Path Mapping**

TypeScript path mapping configured for clean imports:

- `~/*` maps to `./src/*`
- Enables cleaner import statements
- Better IDE support and refactoring

---

## 🧪 Testing Strategy

### **Testing Framework**

- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Next.js Jest Integration**: App router testing support
- **MSW (Mock Service Worker)**: API mocking for tests

### **Test Organization**

```
src/
├── __tests__/             # Global test utilities
├── components/
│   └── __tests__/         # Component tests
├── features/
│   └── __tests__/         # Feature integration tests
└── lib/
    └── __tests__/         # Utility and domain tests
```

### **Testing Patterns**

#### **Component Testing**

```typescript
// Example component test
import { render, screen } from '@testing-library/react';
import { ChatInterface } from '../ChatInterface';

describe('ChatInterface', () => {
  it('renders message input', () => {
    render(<ChatInterface />);
    expect(
      screen.getByPlaceholderText('Type a message...')
    ).toBeInTheDocument();
  });
});
```

#### **Domain Testing**

```typescript
// Example domain logic test
import { chatStore } from '../domains/chat/store';

describe('Chat Domain', () => {
  it('adds new message to store', () => {
    chatStore.getState().addMessage({
      id: '1',
      content: 'Hello World',
      conversationId: 'conv-1',
    });
    expect(chatStore.getState().messages).toHaveLength(1);
  });
});
```

---

## 🚀 Deployment

### **Build Process**

```bash
# Production build
nx build uvian-web

# Output directory
dist/apps/uvian-web/
```

### **Deployment Platforms**

#### **Vercel (Recommended)**

```bash
# Deploy to Vercel
vercel --prod

# Environment variables in Vercel dashboard
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

#### **Other Platforms**

- **Netlify**: Static site deployment
- **AWS S3 + CloudFront**: CDN deployment
- **Docker**: Containerized deployment

### **Environment Setup**

#### **Production Environment**

```env
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
NEXT_PUBLIC_API_URL=https://api.uvian.com
NEXT_PUBLIC_APP_URL=https://app.uvian.com
```

### **Performance Optimization**

- **Next.js Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Lighthouse Optimization**: Performance best practices

---

## 🤝 Contributing

### **Development Guidelines**

1. **Follow Domain Architecture**: Keep domain logic in `lib/domains/`
2. **Use Feature Components**: Organize components in feature folders
3. **Type Safety**: Maintain TypeScript strict typing
4. **Testing**: Write tests for new features
5. **Code Style**: Follow ESLint and Prettier configuration

### **Component Development**

1. **Start with Domain**: Define domain types and logic first
2. **Create Feature Hooks**: Use orchestrator hooks for feature logic
3. **Build UI Components**: Create reusable, themed components
4. **Add Integration**: Connect with services and APIs

### **State Management**

1. **Client State**: Use Zustand for UI state
2. **Server State**: Use TanStack Query for API data
3. **Domain State**: Keep domain logic in domain stores
4. **Feature State**: Use feature hooks for orchestration

---

## 📚 Additional Resources

- **Main Project README**: [`../../README.md`](../../README.md)
- **Architecture Guidelines**: [`.agents/rules/architecture.md`](../../.agents/rules/architecture.md)
- **Agent Guidelines**: [`../AGENTS.md`](../AGENTS.md)
- **Nx Documentation**: [https://nx.dev](https://nx.dev)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)

---

**Built with ❤️ using Next.js, React, and modern web technologies.**
