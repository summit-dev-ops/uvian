'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import type { SelectionContextValue, SelectionMode } from './types';

const SelectionContext = createContext<SelectionContextValue<any> | null>(null);

export function useSelectionContext<T>(): SelectionContextValue<T> {
  const context = useContext(SelectionContext);
  if (!context) {
    return {
      mode: 'none',
      selected: [],
      clearSelection: () => undefined,
      toggleSelected: () => undefined,
      isSelected: () => false,
    };
  }
  // We cast through unknown to safely change the internal 'any' to 'T'
  return context as unknown as SelectionContextValue<T>;
}

interface SelectionProviderProps<T> {
  children: ReactNode;
  selectedItems: T[];
  setSelectedItems: (items: T[]) => void;
  keyExtractor: (item: T) => string;
  mode: SelectionMode;
}

export function SelectionProvider<T>({
  children,
  selectedItems,
  setSelectedItems,
  keyExtractor,
  mode,
}: SelectionProviderProps<T>) {
  const toggleSelected = useCallback(
    (item: T) => {
      const itemKey = keyExtractor(item);
      const exists = selectedItems.map(keyExtractor).includes(itemKey);
      if (mode === 'none') {
        return;
      } else if (mode === 'single-choice') {
        if (exists) {
          setSelectedItems([]);
        } else {
          setSelectedItems([item]);
        }
      } else {
        if (exists) {
          const newItems = selectedItems.filter(
            (s) => keyExtractor(s) !== itemKey
          );
          setSelectedItems([...newItems]);
        } else {
          setSelectedItems([...selectedItems, item]);
        }
      }
    },
    [selectedItems, mode, setSelectedItems]
  );

  const isSelected = useCallback(
    (item: T) => {
      const itemKey = keyExtractor(item);
      return selectedItems.some((s) => keyExtractor(s) === itemKey);
    },
    [selectedItems]
  );

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, [setSelectedItems]);

  const value = useMemo<SelectionContextValue<T>>(() => {
    return {
      isSelected,
      clearSelection,
      toggleSelected,
      selected: selectedItems,
      mode,
    };
  }, [isSelected, clearSelection, toggleSelected, selectedItems, mode]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}
