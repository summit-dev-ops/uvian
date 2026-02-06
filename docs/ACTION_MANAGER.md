# Action Manager System

A generic, state-driven action management system for React applications. This system provides a standardized way to manage list-like data with configurable actions based on selection state, utilizing the existing action system architecture.

## Overview

The Action Manager System solves the problem of managing state-driven actions in list-based interfaces. Instead of hardcoding which actions are available based on selection state, you define actions declaratively and the system automatically shows/hides actions based on the current selection.

## Key Features

- **State-Driven Actions**: Actions automatically appear/disappear based on selection state
- **Bulk Operations**: Handle single item, multiple item, or empty selection scenarios
- **Generic Design**: Works with any data type and component
- **Integration**: Seamlessly integrates with existing BaseAction system
- **Type Safety**: Full TypeScript support with proper typing
- **Grouped UI**: Actions organized by groups for better UX

## Core Components

### 1. SelectionState

Represents what items are currently selected:

```typescript
interface SelectionState<TItem> {
  selectedItems: TItem[];
  selectionCount: number;
  hasSelection: boolean;
  isSingleSelection: boolean;
  isMultipleSelection: boolean;
}
```

### 2. ActionConfig

Defines what actions are available based on selection state:

```typescript
interface ActionConfig<TItem, TParams = any> {
  id: string;
  label: string;
  variant: 'prominent' | 'standard' | 'destructive';
  group: string;

  // Visibility rules
  visibility: {
    minSelection?: number; // Minimum items required
    maxSelection?: number; // Maximum items allowed
    requireSelection?: boolean; // Shorthand for minSelection: 1
    selectionValidator?: (selection: SelectionState<TItem>) => boolean;
  };

  // Action execution
  perform: (
    selection: SelectionState<TItem>,
    params: TParams,
    context: BaseActionContext
  ) => Promise<void> | void;

  // UI properties
  icon?: React.ComponentType<{ className?: string }>;
  requiresConfirmation?: boolean;
  description?: string;
  disabled?: boolean;
}
```

### 3. useActionManager Hook

The main hook that evaluates actions against current selection state:

```typescript
function useActionManager<TItem, TParams = any>(
  selectionState: SelectionState<TItem>,
  actionConfig: ActionConfig<TItem, TParams>[],
  params?: TParams
): ActionManagerResult<TItem, TParams>;
```

## Usage Examples

### Basic Table Integration

```typescript
import { useActionManager } from '~/components/shared/hooks/use-action-manager';
import { createTableSelectionState } from '~/components/shared/utils/create-selection-state';
import { chatActions } from '~/lib/domains/chat/actions';

function ConversationTable() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [rowSelection, setRowSelection] = useState({});

  // Build selection state from table selection
  const selectionState = createTableSelectionState(conversations, rowSelection);

  // Define actions based on selection state
  const actions: ActionConfig<Conversation>[] = [
    {
      id: 'create-conversation',
      label: 'New Conversation',
      variant: 'prominent',
      group: 'primary',
      visibility: { minSelection: 0, maxSelection: 0 },
      perform: async (selection, params, context) => {
        const { perform: createConversation } = useAction(
          chatActions.createConversation()
        );
        await createConversation({ title: 'New Chat' });
      },
      icon: Plus,
    },
    {
      id: 'edit-conversation',
      label: 'Edit',
      variant: 'prominent',
      group: 'primary',
      visibility: { requireSelection: true, maxSelection: 1 },
      perform: async (selection, params, context) => {
        const conversation = selection.selectedItems[0];
        context.router.push(`/chats/${conversation.id}/edit`);
      },
      icon: Edit,
    },
    {
      id: 'delete-conversations',
      label: 'Delete Selected',
      variant: 'destructive',
      group: 'danger',
      visibility: { minSelection: 1 },
      perform: async (selection, params, context) => {
        const conversationIds = selection.selectedItems.map((c) => c.id);
        await chatActions.bulkDeleteConversations(conversationIds, context);
      },
      icon: Trash2,
      requiresConfirmation: true,
    },
  ];

  const { groupedActions, performAction } = useActionManager(
    selectionState,
    actions,
    { userId: currentUserId } // Optional parameters
  );

  return (
    <div>
      <ActionToolbar groupedActions={groupedActions} onAction={performAction} />
      <DataTable
        data={conversations}
        onRowSelectionChange={setRowSelection}
        // ... other table props
      />
    </div>
  );
}
```

### Using ActionManagerProvider

For easier integration, use the provider wrapper:

```typescript
import { ActionManagerProvider } from '~/components/shared/hocs/with-action-manager';

function ConversationList() {
  const [conversations] = useState<Conversation[]>([]);
  const [rowSelection, setRowSelection] = useState({});

  const selectionState = createTableSelectionState(conversations, rowSelection);

  const actionConfig = [
    // ... action definitions
  ];

  return (
    <ActionManagerProvider
      selectionState={selectionState}
      actionConfig={actionConfig}
      params={{ userId: currentUserId }}
      showToolbar={true}
      toolbarProps={{ className: 'mb-4' }}
    >
      <DataTable data={conversations} onRowSelectionChange={setRowSelection} />
    </ActionManagerProvider>
  );
}
```

### Complex Visibility Rules

```typescript
const actions: ActionConfig<User, { currentUserRole: string }>[] = [
  {
    id: 'promote-user',
    label: 'Promote to Admin',
    variant: 'prominent',
    group: 'management',
    visibility: {
      requireSelection: true,
      selectionValidator: (selection) => {
        // Only show if all selected users are not already admins
        return selection.selectedItems.every((user) => user.role !== 'admin');
      },
    },
    perform: async (selection, params, context) => {
      if (params.currentUserRole !== 'admin') return;
      const userIds = selection.selectedItems.map((u) => u.id);
      await userActions.bulkPromoteToAdmin(userIds, context);
    },
  },
];
```

## Selection State Builders

Utility functions to create SelectionState from common patterns:

### TanStack Table Selection

```typescript
import { createTableSelectionState } from '~/components/shared/utils/create-selection-state';

const selectionState = createTableSelectionState(data, rowSelection);
```

### Array Selection

```typescript
import { createArraySelectionState } from '~/components/shared/utils/create-selection-state';

const selectionState = createArraySelectionState(selectedItems);
```

### Object Selection

```typescript
import { createObjectSelectionState } from '~/components/shared/utils/create-selection-state';

const selectionState = createObjectSelectionState(
  selectionObject, // { itemId1: true, itemId2: false }
  getItemById // Function to retrieve item by ID
);
```

## Domain Action Integration

Add bulk operations to your domain actions:

```typescript
// lib/domains/chat/actions/index.ts
export const chatActions = {
  // ... existing BaseAction implementations

  // Bulk operations (static functions)
  bulkDeleteConversations: async (
    conversationIds: string[],
    context: BaseActionContext
  ) => {
    const promises = conversationIds.map(async (conversationId) => {
      await executeMutation(
        context.queryClient,
        chatMutations.deleteConversation(context.queryClient, conversationId),
        { conversationId }
      );
    });
    await Promise.all(promises);
  },

  bulkUpdateMemberRole: async (
    profileIds: string[],
    newRole: string,
    context: BaseActionContext,
    conversationId: string
  ) => {
    const promises = profileIds.map(async (profileId) => {
      await executeMutation(
        context.queryClient,
        chatMutations.updateConversationMemberRole(context.queryClient),
        { userId: profileId, conversationId, role: newRole }
      );
    });
    await Promise.all(promises);
  },
};
```

## Action Groups

Actions are automatically grouped by their `group` property:

- **primary**: Main actions (create, edit single items)
- **secondary**: Additional actions (bulk operations, settings)
- **danger**: Destructive actions (delete, remove)

The UI automatically organizes actions based on groups and variants.

## Advanced Patterns

### Context Menu Actions

```typescript
function withContextMenuActions<TItem>(
  Component: React.ComponentType<any>,
  getSelectionState: () => SelectionState<TItem>,
  actionConfig: ActionConfig<TItem>[]
) {
  return function WrappedComponent(props: any) {
    const [menuOpen, setMenuOpen] = useState(false);
    const selectionState = getSelectionState();
    const { groupedActions, performAction } = useActionManager(
      selectionState,
      actionConfig
    );

    return (
      <Component
        {...props}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuOpen(true);
        }}
      >
        <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <ContextMenuContent>
            {Object.entries(groupedActions).map(([group, actions]) => (
              <ContextMenuGroup key={group}>
                {actions.map((action) => (
                  <ContextMenuItem
                    key={action.id}
                    onClick={() => performAction(action.id)}
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuGroup>
            ))}
          </ContextMenuContent>
        </ContextMenu>
      </Component>
    );
  };
}
```

### Form Actions

```typescript
function FormWithActions() {
  const [formData, setFormData] = useState(initialData);
  const [isDirty, setIsDirty] = useState(false);

  const formState = createArraySelectionState(isDirty ? [formData] : []);

  const actions: ActionConfig<FormData>[] = [
    {
      id: 'save-form',
      label: 'Save Changes',
      variant: 'prominent',
      group: 'primary',
      visibility: {
        minSelection: 1,
        maxSelection: 1,
        selectionValidator: (selection) => isFormValid(formData),
      },
      perform: async (selection, params, context) => {
        await userActions.updateProfile(formData, context);
        setIsDirty(false);
      },
    },
  ];

  const { groupedActions } = useActionManager(formState, actions);

  return (
    <div>
      <ActionToolbar groupedActions={groupedActions} />
      <Form fields={formFields} />
    </div>
  );
}
```

## Best Practices

1. **Keep Actions Simple**: Each action should do one thing well
2. **Use Descriptive IDs**: `delete-conversations` instead of `delete`
3. **Group Related Actions**: Actions that work together should be in the same group
4. **Handle Loading States**: Actions should be disabled during execution
5. **Require Confirmation**: Destructive actions should have `requiresConfirmation: true`
6. **Type Safety**: Always specify generic types for `TItem` and `TParams`
7. **Error Handling**: Actions should handle errors gracefully
8. **User Feedback**: Show loading states and success/error messages

## Migration Guide

### From Hardcoded Actions

**Before:**

```typescript
const hasSelection = Object.keys(rowSelection).length > 0;
const isSingle = Object.keys(rowSelection).length === 1;

return (
  <div>
    {hasSelection && (
      <Button onClick={handleEdit} disabled={!isSingle}>
        Edit
      </Button>
    )}
    <Button onClick={handleDelete} disabled={!hasSelection}>
      Delete
    </Button>
  </div>
);
```

**After:**

```typescript
const selectionState = createTableSelectionState(data, rowSelection);
const { groupedActions } = useActionManager(selectionState, actions);

return <ActionToolbar groupedActions={groupedActions} />;
```

## Performance Considerations

1. **Memoize Action Config**: Define action configs outside render when possible
2. **Optimize Selection State**: Only recalculate when selection actually changes
3. **Group Actions Wisely**: Too many groups can clutter the UI
4. **Disable Expensive Actions**: Use `disabled` property for actions that are computationally expensive

This action manager system provides a powerful, flexible way to manage state-driven actions while maintaining the simplicity and type safety of your React application.
