# Uvian Web - Next.js Frontend Application

[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Uvian Web** is the frontend application for the platform, built with Next.js 16 and React 19. It provides a modern, responsive user interface with real-time messaging capabilities, AI integration, and enterprise-grade user experience.

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

## 📚 Additional Resources

- **Main Project README**: [`../../README.md`](../../README.md)
- **Architecture Guidelines**: [`.agents/rules/architecture.md`](../../.agents/rules/architecture.md)
- **Agent Guidelines**: [`../AGENTS.md`](../AGENTS.md)
- **Nx Documentation**: [https://nx.dev](https://nx.dev)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)

