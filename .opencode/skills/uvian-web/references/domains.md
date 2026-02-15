
# Domains

Domains are self-contained libraries of DDD oriented imperative logic. They expose storeSlices, queries, mutations, types and actions. 

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
  ├── types.ts        # Data types
  └── utils.ts        # Complex logic that is often used within the domain
```

## 🛠 The API Layer Patterns

### Query Key Factory (`api/keys.ts`)
Standardize keys to ensure precise cache invalidation, using the recommended react-query key factory pattern. Some domains, will require the authProfileId as an additional parameter. 
YOU MUST ALWAYS CREATE and USE the proper key factories. 

```typescript
export const domainKeys = {
  all: ['domain'] as const,
  lists: () => [...domainKeys.all, 'list'] as const,
  list: (filter: string) => [...domainKeys.lists(), { filter }] as const,
  detail: (id: string) => [...domainKeys.all, 'detail', id] as const,
};
```

### Utils (`utils.ts`)
Utils are any function or logic you need repeated many times within the domain. YOU SHOULD ALWAYS CREATE an utils file, but you don't need to create exposed utility functions if there is no reason for them.

```typescript
export const domainUtils = {
  compareTimeZones: ...
};
```

### Types (`types.ts`)

All to be exposed types must be defined within the types file. Always, try to define every part of the contract, avoid anys if possible. Consider what the contracts are on the API. Use best practices of inheritance and general TypeScript best practices.


### Queries & Mutations (`api/queries.ts`, `api/mutations.ts`)

The core concept of domains is that no domain code is reactive, everything that is in a domain is a layer of abstraction before reactive code lifecycles are reached. You must always define both queries and mutations files. Both files should export an object that has the queries and mutations respectively.

```typescript
// queries.ts
export const domainQueries = {
  list: () =>
    queryOptions({
      queryKey: domainKeys.lists(),
      queryFn: async () => {
        const { data } = await apiClient.get(`/api/items`);
        return data
      },
    }),
};
```

## ⚡ The Action Pattern (`actions/index.ts`)

Actions within the domains are reusable non reactive behaviours that either update the store or the query cache or perform calls to the server via mutations. YOU MUST ALWAYS DEFINE an Actions file. Each action has its own factory, for almost all of the factories, you don't need to add any params as part of the call params of the factory. The payload is generally prefered as a place for params like: profileId, conversationId, etc. This is because the app ideally reuses actions without needing substational mounting logic.

```typescript
import { BaseAction, executeMutation } from '~/lib/infrastructure';

export const domainActions = {
  create: (): BaseAction<Payload, Promise<void>> => ({
    id: 'domain.create',
    group: 'domain',
    variant: 'info',
    canPerform: (ctx, payload) => payload.isValid(),
    perform: async (ctx, payload) => {
      await executeMutation(
        ctx.queryClient,
        domainMutations.create(ctx.queryClient),
        payload
      );
      ctx.router.push('/success');
    },
  }),
};
```

### The Action Context Pattern (`actions/index.ts`)
The action context allows a systematic universal access to the combined slices of the app, the react-query client, and the router we use for navigation. 

```typescript
import { QueryClient } from '@tanstack/react-query';
import { StoreApi } from 'zustand';
import { AppState } from '~/lib/stores';

export type BaseActionContext = {
  queryClient: QueryClient;
  store: StoreApi<AppState>;
  router: any; // Type according to your router (e.g., AppRouterInstance)
};
```

## 🚦 Technical Rules
- ✅ **DECORATIVE QUERIES**: Use `queryOptions` to make fetching declarative.
- ✅ **OPTIMISTIC UI**: Always implement `onMutate` and `snapshot` rollback in mutations.
