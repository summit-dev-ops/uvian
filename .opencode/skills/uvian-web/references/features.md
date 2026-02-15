
# Features

Features orchestrate multiple `lib/domains` modules to solve specific user stories.

## 🏗 Directory Structure

```text
/components/features/[feature]/
  ├── hooks/                  # Orchestration (The "Bridge")
  │   └── use-[feature].ts
  ├── components/             # High-level feature UI
  │   ├── interfaces/         # The largest components: loading, error handling and data fetching, mounted directly by screens
  │   ├── forms/              # Forms for this feature, no data fetching, prop driven
  │   ├── pages/              # Page specific components and contexts
  │   │   ├── actions/        # Page specific actions
  │   │   └── breadcrumbs/    # Breadcrumbs to show within the page header
  │   ├── search/             # Defined components for displaying feature items within search results
  │   ├── ...
  │   └── component.tsx/      # Basic component(s)
  └── types.ts                # Local feature UI types
```

## 🌉 1. The "Hook Bridge" Pattern

Feature components must never call domain API clients or raw queries directly. They must use an orchestrator hook. Keep the hooks simple, specific to their task. Maintain composable react patterns, and avoid combining many different responsibilities in one hook. 

## 🎨 2. Component Composition

Features should compose primitive UI elements from the feature and from @org/ui and domain-specific molecules.

### Interfaces
Interfaces are the main components that a feature exposes. These components are designed to be mounted pretty much anywhere without too high prop requirement.

### Forms
YOU ALWAYS use the standardised react-hook-form based forms , with the Field structure exposed by @org/ui. It is imperative that you make as much of the input system using these forms as possible. Forms don't use the api, they don't handle their own data, they are strictly prop driven.

### Pages
Pages folder contains components directly mounted by pages of the app. There are two main subfolders in each pages folder: actions and breadcrumbs. Since the app pages are serverside these components are all client side and need to fetch their own data. Naturally this should be done from the domains, from the hooks we have inside the feature.

#### Actions
Actions folder contains react context providers that implement PageActionContexts. These are important components that allow the user to access powerful methods and functions that make the app usage predicatble and simple. The folder also page specific action components that are mounted by the pageHeader components on each page to expose page specific actions. A generic page specific action would be: "Share page" or "Refresh content". While page specific actions would be: "Create new conversation" on the conversations page. There is a system of modals that are opened and hooked into the context that makes it easy to add new dialogs for the user to use.

#### Breadcrumbs
The breadcrumbs folder contains componnets that are defined for each page, these components are used to display interactive breadcrumb header contents for the user. These Breadcrumb components like most other are coming from the @org/ui package. Th

### Search
Search folder provides componets needed to display search results for feature elements. For example the chat feature exposes conversation and message search result display items.

## About Tables
Many of the operations the user needs to do are done via tables, these tables must always be created using the react-query-tables through @org/ui table components. Additionally, a shared system exists for contextual actions that you must use. 

## ⚖️ Technical Rules

- ✅ **DOMAIN ORCHESTRATION**: A single feature can (and should) import from as many `lib/domains` as needed to fulfill the requirement.
- ✅ **PURE UI BOUNDARIES**: Feature components handle layout and interaction; they delegate **all** domain-state transitions to the orchestrator hook.
- ✅ **ABSTRACTION**: Components should only see the outcome and simplified methods provided by the orchestrator.
- ✅ **LIBRARY FIRST**: If a calculation or fetch can be shared, it belongs in `lib/domains`, not in the feature.

> [!IMPORTANT] > **Decoupling Rule**: UI is tied to a **Feature**, Logic is tied to a **Domain**. Do not lock your UI components into domain folders if they need to orchestrate multiple systems, in that case use the shared folder. For example, invite forms are used by conversations and spaces.
