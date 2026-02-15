---
name: uvian-web
description: Writing, modifying react code for the uvian-web application. INVOKE immediately, whenever working or reading code within the uvian-web folder. USE ALWAYS when needing to create new files or code.
---

# Uvian Web Basics

Uvian web is a creator commuinity platform. It is written as part of an NX monorepo, and uses "NextJs (App router)", "tailwind", "react-query", "zustand" and "socket.io".

The app uses a "domain" oriented structure, where "domains" are combined into "features".

You must write all domains to be non-reactive: imperative business logic, store definitions, query and mutation definitions alongside a standardised pattern of imperative actions.

Features are using the domains to combine their exposed types, queries and actions to provide valuable features for the user.


## References

Consult these resources as needed:

```
references/
  features.md          
  domains.md          
```

# General React Code practices

These are universally applicable rules to any time you write components, hooks, contexts.

## 1. Keep things specific and Modular

Write code with intent. There is nothing worse than overcomplicated monolithic code. Always prefer composition than inheritance.

- Break components into small, reusable pieces

- Organize folders by feature or domain

- Avoid deeply nested logic in render methods

- Use constants and utility functions for shared logic

### Components

Keep components clean by pushing for flatter div structures, and the usage of reusable components from the @org/ui library or the shared component library. Always consider if a component is mounted in a way where they can become prop driven.

### Hooks

Always use direct simple hooks that have a clear responsibility in mind. Don't mix and combined many hooks and responsibilites to expose domain logic through one mega hook.

### Contexts

Avoid using contexts whenever possible. If using contexts keep them as primarily action based system where the context doesn't really expose states that the components below rely on.

## 2. Avoid useEffects

UseEffects can be difficult to work with and for 99% of the time you can get around them by smart composition of logic and components.

## 3. Zod and Types

We use Zod to validate form data, and we use regular TS types for general data flow. You must ensure that all logic/component you work is properly typed out. Import types with the type specifier.

## 4. Zustand

We use Zustand for centralised state management. Always define specific access hooks for using zustand. 

## 5. Data syncronisation pattern
Throughout the application there is one major rule. Single source of truth. If a piece of data is coming from the server, it must only be coming from the server. If a piece of data is coming from the client it must only be coming from the client. AS such if you have data from the API use optimistic react-query practices that allow the app to optimistaclly mutate the query-cache. If you need drafting support you use Zustand store slices to store domain specific drafts such as for forms and inputs. YOU SHOULD NEVER try to use useEffect to syncrhonise the local state of a component from standard react state hooks (useState, useReducer) to keep the data in sync with the server or the store. You should also avoid syncing the other direction as well.


