#  Page Composition System

## 1. Core Philosophy
*   **Server-Side Only:** All components inside `src/app/routes` (Pages) are **Server Components**. They never use `use client` or hooks.
*   **Separation of Concerns:**
    *   **Pages:** Define the shell, layout, breadcrumbs, global actions, and modal containers.
    *   **Interfaces:** Define the actual UI, data fetching, and interactivity. Interfaces are **Client Components**.
*   **Context Wrapping:** Pages usually wrap their content in a specific `<...ActionProvider>` to share state between the Header (actions) and the Modals.

## 2. Structural Blueprint
Every Dashboard Page must follow this exact DOM hierarchy:

```jsx
<SpecificActionProvider>                 {/* 1. Context for Actions/Modals */}
  <PageContainer>                        {/* 2. Root Shell */}
    <PageHeader>                         {/* 3. Navigation & Toolbar */}
       <Breadcrumbs />                   {/*    Left: Context */}
       <PageActions>                     {/*    Right: Global Tools */}
         <SpecificActions />
       </PageActions>
    </PageHeader>
    <PageContent>                        {/* 4. Scrollable Area */}
       <SpecificInterface />             {/*    The actual Client Component */}
    </PageContent>
    <PageModals />                       {/* 5. Dialogs/Drawers */}
  </PageContainer>
</SpecificActionProvider>
```

## 3. Component Usage Rules

### PageContainer
The root wrapper for the route.
*   **Import:** `~/components/shared/ui/pages/page-container`
*   **Props:**
    *   `size="full"` (Standard for Dashboards)
    *   `className="flex flex-1 flex-col min-h-0 relative"` (Mandatory for proper flex scrolling)

### PageHeader
The top navigation bar. It automatically renders the `SidebarTrigger` and `Back Button`.
*   **Import:** `~/components/shared/ui/pages/page-container`
*   **Layout:** You must apply `flex flex-row flex-1 items-center justify-between` to position Breadcrumbs on the left and Actions on the right.
*   **Children:** Accepts two distinct elements:
    1.  **Breadcrumbs:** Component showing current path.
    2.  **PageActions:** Wrapper for global buttons (Create, Refresh, Filter).

### PageContent
The scrollable viewport for the main content.
*   **Import:** `~/components/shared/ui/pages/page-container`
*   **Role:** Strictly a container. Do not write inline UI code here. Mount a **Single Interface Component**.
*   **Props:** `className="flex flex-1 flex-col min-h-0 relative"`

### PageActions (Component)
*   **Import:** `~/components/shared/ui/pages/page-header/page-actions`
*   **Role:** Visual wrapper for action buttons. Place this inside `PageHeader`.

### PageModals (Component)
*   **Import:** `~/components/shared/ui/pages/page-actions/page-modals`
*   **Role:** A unified outlet for modals triggered by the `ActionProvider`. Placed as the last child of `PageContainer`.

## 4. Implementation Logic

### Dashboard Pages
*   **Must** use `PageHeader`.
*   **Must** use `SidebarTrigger` (built-in to Header).
*   **Data:** Does **not** fetch data. Passes `params` (if any) down to the Interface.

### Standalone Pages (e.g., Auth, Onboarding)
*   Use `PageContainer` with `size="contained"` or `size="wide"`.
*   `PageHeader` is optional.
*   Focused on single-purpose flows.

## 5. Constraint Checklist for Agents
*   [ ] Is the file a Server Component? (No `'use client'`).
*   [ ] Is the `PageHeader` used for Breadcrumbs and Actions?
*   [ ] Is the main UI logic encapsulated in an `<...Interface />` component?
*   [ ] Are Modals placed at the bottom of the container, outside the content?
*   [ ] Is the header styled with `justify-between` to separate breadcrumbs and actions?

---

### Reference Code (Dashboard Pattern)

```tsx
import React from 'react';
// 1. UI Components
import { PageContainer, PageContent, PageHeader } from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { PageModals } from '~/components/shared/ui/pages/page-actions/page-modals';

// 2. Feature Components (Providers, Actions, Breadcrumbs, Interface)
import { UsersActionProvider, UsersPageActions } from '~/components/features/users/pages/actions';
import { UsersBreadcrumb } from '~/components/features/users/pages/breadcrumbs';
import { UsersListInterface } from '~/components/features/users/interfaces/users-list-interface';

export default async function UsersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <UsersActionProvider>
      <PageContainer size="full" className="flex flex-1 flex-col min-h-0 relative">
        
        {/* Navigation & Toolbar */}
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <UsersBreadcrumb />
          <PageActions>
            <UsersPageActions />
          </PageActions>
        </PageHeader>

        {/* Main Content (Client Side Interface) */}
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
           {/* Interface fetches its own data */}
          <UsersListInterface userId={id} />
        </PageContent>

        {/* Modal Outlet */}
        <PageModals />

      </PageContainer>
    </UsersActionProvider>
  );
}
```