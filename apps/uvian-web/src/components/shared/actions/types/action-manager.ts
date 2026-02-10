import type { BaseActionContext } from '~/lib/actions';

/**
 * Selection state interface representing what items are selected
 */
export interface SelectionState<TItem> {
  selectedItems: TItem[];
  selectionCount: number;
  hasSelection: boolean;
  isSingleSelection: boolean;
  isMultipleSelection: boolean;
}

/**
 * Action configuration for the action manager
 * Defines visibility rules and action behavior based on selection state
 */
export interface ActionConfig<TItem, TParams = any> {
  id: string;
  label: string;
  variant: 'prominent' | 'standard' | 'destructive';
  group: string;

  // Visibility rules based on selection state
  visibility: {
    minSelection?: number;
    maxSelection?: number;
    requireSelection?: boolean; // Shorthand for minSelection: 1
    selectionValidator?: (selection: SelectionState<TItem>) => boolean;
  };

  // Action function receives selection state, params, and context
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

/**
 * Result from the useActionManager hook
 */
export interface ActionManagerResult<TItem, TParams> {
  availableActions: Array<ActionConfig<TItem, TParams>>;
  groupedActions: Record<string, Array<ActionConfig<TItem, TParams>>>;
  performAction: (actionId: string) => Promise<void>;
}

/**
 * Props for the ActionToolbar component
 */
export interface ActionToolbarProps<TItem, TParams = any> {
  groupedActions: Record<string, Array<ActionConfig<TItem, TParams>>>;
  onAction?: (actionId: string) => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'dropdown';
  children?: React.ReactNode;
}

/**
 * Props for individual action buttons
 */
export interface ActionButtonProps<TItem, TParams = any> {
  action: ActionConfig<TItem, TParams>;
  isLoading?: boolean;
  onClick: () => void | Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

/**
 * Props for action groups
 */
export interface ActionGroupProps<TItem, TParams = any> {
  name: string;
  actions: Array<ActionConfig<TItem, TParams>>;
  isLoading?: boolean;
  onAction: (actionId: string) => void | Promise<void>;
  layout?: 'horizontal' | 'vertical' | 'dropdown';
}
