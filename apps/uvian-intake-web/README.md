# uvian-intake-web

Public-facing intake form rendering application. Displays dynamic intake forms (created via uvian-intake-api), handles form submission, and shows success/expired states.

## Tech Stack

| Technology       | Purpose                      |
| ---------------- | ---------------------------- |
| **Next.js**      | React framework (App Router) |
| **React**        | UI library                   |
| **TypeScript**   | Type safety                  |
| **Tailwind CSS** | Utility-first styling        |
| **@org/ui**      | Shared UI component library  |

## Directory Structure

```
apps/uvian-intake-web/
├── src/
│   └── app/
│       ├── layout.tsx            # Root layout with styles
│       ├── page.tsx              # Landing/home page
│       ├── styles.css            # Global styles
│       ├── t/
│       │   └── [tokenId]/
│       │       └── page.tsx      # Dynamic intake form page
│       ├── success/
│       │   └── page.tsx          # Submission success page
│       └── expired/
│           └── page.tsx          # Expired intake page
├── next.config.js                # Next.js + Nx config
├── tailwind.config.js            # Tailwind with shadcn/ui tokens
├── postcss.config.js             # PostCSS config
└── package.json
```

## Pages/Routes

| Route          | Description                                          |
| -------------- | ---------------------------------------------------- |
| `/`            | Landing page                                         |
| `/t/[tokenId]` | Dynamic intake form (fetches schema from intake API) |
| `/success`     | Form submission success confirmation                 |
| `/expired`     | Expired intake notice                                |

## Environment Variables

| Variable                               | Purpose              |
| -------------------------------------- | -------------------- |
| `NEXT_PUBLIC_INTAKE_API_URL`           | Intake API base URL  |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key    |

## Architecture

- **Next.js App Router** with server components
- **Dynamic form rendering** from JSON schema fetched from intake API
- **E2E encryption** support for sensitive form fields (RSA public key per intake)
- **Shared UI** from `@org/ui` package (shadcn/ui components)
- **Tailwind CSS** with CSS custom property design tokens

## Commands

```bash
# Build
npx nx build @org/uvian-intake-web

# Serve (development)
npx nx serve @org/uvian-intake-web

# Lint
npx nx lint @org/uvian-intake-web

# Typecheck
npx nx typecheck @org/uvian-intake-web
```

## Deployment

Deployed on **Railway**.

- **Start command:** `npx nx run @org/uvian-intake-web:start`
- **Health check:** `GET /` (60s timeout)
- **Restart policy:** `on_failure` (production), `always` (staging)
- **Watch patterns:** `apps/uvian-intake-web/**`, `packages/ui/**`, `nx.json`, `package.json`, `package-lock.json`, `tsconfig.base.json`
