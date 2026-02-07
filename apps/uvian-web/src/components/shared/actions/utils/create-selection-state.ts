import type { SelectionState } from '../types/action-manager';

/**
 * Utility functions for creating SelectionState from common selection patterns
 */

/**
 * Create SelectionState from a simple array of selected items
 * @param selectedItems - Array of selected items
 * @returns SelectionState<TItem> with computed metadata
 */
export function createArraySelectionState<TItem>(
  selectedItems: TItem[]
): SelectionState<TItem> {
  const selectionCount = selectedItems.length;

  return {
    selectedItems,
    selectionCount,
    hasSelection: selectionCount > 0,
    isSingleSelection: selectionCount === 1,
    isMultipleSelection: selectionCount > 1,
  };
}

/**
 * Create SelectionState from TanStack table row selection
 * @param data - The data array that the table is based on
 * @param rowSelection - TanStack table row selection object (index-based)
 * @returns SelectionState<TItem> with selected items from the data array
 */
export function createTableSelectionState<TItem>(
  data: TItem[],
  rowSelection: Record<string, boolean>
): SelectionState<TItem> {
  // Get selected row indices from TanStack selection object
  const selectedIndices = Object.entries(rowSelection)
    .filter(([_, isSelected]) => isSelected)
    .map(([index]) => parseInt(index, 10));

  // Extract selected items from the data array using indices
  const selectedItems = selectedIndices
    .map((index) => data[index])
    .filter((item) => item !== undefined);

  const selectionCount = selectedItems.length;

  return {
    selectedItems,
    selectionCount,
    hasSelection: selectionCount > 0,
    isSingleSelection: selectionCount === 1,
    isMultipleSelection: selectionCount > 1,
  };
}

/**
 * Create SelectionState from object-based selection (e.g., checkbox selections)
 * @param selectionObject - Object where keys are item IDs and values are boolean selections
 * @param getItemById - Function to retrieve item data by ID
 * @returns SelectionState<TItem> with selected items
 */
export function createObjectSelectionState<TItem extends { id: string }>(
  selectionObject: Record<string, boolean>,
  getItemById: (id: string) => TItem | undefined
): SelectionState<TItem> {
  // Get selected IDs from the selection object
  const selectedIds = Object.entries(selectionObject)
    .filter(([_, isSelected]) => isSelected)
    .map(([id]) => id);

  // Retrieve the actual items using the getItemById function
  const selectedItems = selectedIds
    .map((id) => getItemById(id))
    .filter((item): item is TItem => item !== undefined);

  const selectionCount = selectedItems.length;

  return {
    selectedItems,
    selectionCount,
    hasSelection: selectionCount > 0,
    isSingleSelection: selectionCount === 1,
    isMultipleSelection: selectionCount > 1,
  };
}

/**
 * Create empty SelectionState (useful for initial state)
 * @returns Empty SelectionState with no selections
 */
export function createEmptySelectionState<TItem>(): SelectionState<TItem> {
  return {
    selectedItems: [],
    selectionCount: 0,
    hasSelection: false,
    isSingleSelection: false,
    isMultipleSelection: false,
  };
}

/**
 * Create SelectionState from a Set of selected items
 * @param selectedSet - Set of selected items
 * @returns SelectionState<TItem> with computed metadata
 */
export function createSetSelectionState<TItem>(
  selectedSet: Set<TItem>
): SelectionState<TItem> {
  const selectedItems = Array.from(selectedSet);
  const selectionCount = selectedItems.length;

  return {
    selectedItems,
    selectionCount,
    hasSelection: selectionCount > 0,
    isSingleSelection: selectionCount === 1,
    isMultipleSelection: selectionCount > 1,
  };
}
