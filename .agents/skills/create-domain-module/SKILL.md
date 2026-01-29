---
name: create-domain-module
description: Deeply integrated guide for building encapsulated domain logic libraries with BaseAction and API infrastructure.
---

# Skill: Create Domain Module (Integrated)

Use this skill to build a self-contained domain library in `lib/domains/[domain]`. This follows strict DDD principles and integrates with the project's global infrastructure.

## 🏗 Directory Structure

```text
/lib/domains/[domain]/
  ├── actions/        # Encapsulated business logic
  │   └── index.ts    # Exports BaseAction objects
  ├── api/
  │   ├── index.ts
  │   ├── keys.ts     # Query Key Factory
  │   ├── queries.ts  # queryOptions + Data Transformation
  │   └── mutations.ts # mutationOptions + Optimistic Updates
  ├── store/
  │   ├── index.ts
  │   └── [domain]-slice.ts
  ├── types.ts        # NodeAPI vs NodeUI types
  └── utils.ts        # apiToUi transformers
```

## 🛠 1. The API Layer Patterns

### Query Key Factory (`api/keys.ts`)

Standardize keys to ensure precise cache invalidation.

```typescript
export const domainKeys = {
  all: ["domain"] as const,
  lists: () => [...domainKeys.all, "list"] as const,
  list: (filter: string) => [...domainKeys.lists(), { filter }] as const,
  detail: (id: string) => [...domainKeys.all, "detail", id] as const,
};
```

### Transformer & Types (`types.ts`, `utils.ts`)

Always separate API models from UI models. Include `syncStatus`.

```typescript
// types.ts
export type NodeUI = { id: string; title: string; syncStatus: DataSyncStatus };

// utils.ts
export const domainUtils = {
  apiToUi: (raw: NodeAPI): NodeUI => ({
    id: raw.id,
    title: raw.name,
    syncStatus: "synced",
  }),
};
```

### Queries & Mutations (`api/queries.ts`, `api/mutations.ts`)

Use `queryOptions` and implement optimistic updates.

```typescript
// queries.ts
export const domainQueries = {
  list: (tenantId: string) =>
    queryOptions({
      queryKey: domainKeys.list(tenantId),
      queryFn: async () => {
        const { data } = await apiClient.get(`/api/${tenantId}/items`);
        return data.map(domainUtils.apiToUi);
      },
    }),
};
```

## ⚡ 2. The Action Pattern (`actions/index.ts`)

Use `BaseAction` for complex logic and `executeMutation` to bridge with the API.

```typescript
import { BaseAction, executeMutation } from "~/lib/infrastructure";

export const domainActions = {
  create: (tenantId: string): BaseAction<Payload, Promise<void>> => ({
    id: "domain.create",
    group: "domain",
    variant: "info",
    canPerform: (ctx, payload) => !!tenantId && payload.isValid(),
    perform: async (ctx, payload) => {
      await executeMutation(
        ctx.queryClient,
        domainMutations.create(ctx.queryClient, tenantId),
        payload,
      );
      ctx.router.push("/success");
    },
  }),
};
```

### 4. The Action Context Pattern (`actions/index.ts`)

```typescript
import { QueryClient } from "@tanstack/react-query";
import { StoreApi } from "zustand";
import { AppState } from "~/lib/stores";

export type BaseActionContext = {
  queryClient: QueryClient;
  store: StoreApi<AppState>;
  router: any; // Type according to your router (e.g., AppRouterInstance)
};
```

## 🚦 Technical Rules

- ❌ **NO DOMAIN LEAKAGE**: Do not import from other folders in `lib/domains`.
- ✅ **DECORATIVE QUERIES**: Use `queryOptions` to make fetching declarative.
- ✅ **OPTIMISTIC UI**: Always implement `onMutate` and `snapshot` rollback in mutations.
- ✅ **SYNC STATUS**: Ensure all UI models include `DataSyncStatus`.
