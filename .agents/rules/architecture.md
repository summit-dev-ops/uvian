# Feature-Driven Frontend Architecture (V2)

This project follows a strict separation between **Encapsulated Domain Logic** and **Feature-Driven Orchestration**.

## 1. Directory Layout & Naming

Standardized file naming is required for agent predictability.

```text
/lib/domains/[domain]/
  ├── api/
  │   ├── index.ts        # Exports queries and mutations
  │   ├── keys.ts         # Query Key Factory
  │   ├── queries.ts      # TanStack Query queryOptions
  │   └── mutations.ts    # TanStack Query mutationOptions
  ├── store/
  │   ├── index.ts        # Exports the store slice
  │   └── [domain]-slice.ts # Slice implementation
  ├── types.ts            # Domain types (API vs UI)
  └── utils.ts            # Transformers (apiToUi)

/components/features/[feature]/
  ├── hooks/              # Feature-specific orchestrators
  │   └── use-[feature].ts
  ├── components/          # Compound components or molecules
  │   └── [FeatureName].tsx
  ├── index.ts            # Public feature API
  └── types.ts            # Feature-specific UI types
```

## 2. Technical Rules

### A. The "Domain Sandbox" rule

- Domains must be completely self-contained.
- Imports from `~/lib/domains/other-domain` are **hard errors**.
- Use the **Feature Layer** to bridge domains.

### B. The "Hook Bridge" rule

- Feature components should never call `useQuery` or `useMutation` directly from a domain library.
- They must use a **Feature Hook** that abstracts the domain interaction.

### C. The "Transformer" rule

- Raw API data should never leak into components.
- Always use the `apiToUi` transformer in the domain's `queries.ts`.
