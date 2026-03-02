'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@org/ui';
import { Button } from '@org/ui';
import { SearchInterface } from './search-interface';
import type { SearchDialogProps } from '../contexts/types';

export function SearchDialog<T>({
  open,
  onOpenChange,
  SearchProvider,
  initialSelected = [],
  onSubmit,
  title = 'Search',
  submitLabel = 'Add',
}: SearchDialogProps<T>) {
  const [localSelected, setLocalSelected] =
    React.useState<T[]>(initialSelected);

  const handleSubmit = () => {
    onSubmit(localSelected);
    onOpenChange(false);
    setLocalSelected([]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setLocalSelected(initialSelected);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <SearchProvider
          initialSelected={initialSelected}
          onSubmit={(selected) => {
            setLocalSelected(selected);
          }}
        >
          {(context) => (
            <SearchInterfaceWithActions
              context={context}
              localSelected={localSelected}
              setLocalSelected={setLocalSelected}
              onSubmit={handleSubmit}
              submitLabel={submitLabel}
            />
          )}
        </SearchProvider>
      </DialogContent>
    </Dialog>
  );
}

interface SearchInterfaceWithActionsProps<T> {
  context: any;
  localSelected: T[];
  setLocalSelected: (items: T[]) => void;
  onSubmit: () => void;
  submitLabel: string;
}

function SearchInterfaceWithActions<T>({
  context,
  localSelected,
  setLocalSelected,
  onSubmit,
  submitLabel,
}: SearchInterfaceWithActionsProps<T>) {
  const { toggleSelected, clearSelection } = context;

  const handleItemClick = (item: T) => {
    toggleSelected(item);
    setLocalSelected([
      ...localSelected.filter(
        (s) => JSON.stringify(s) !== JSON.stringify(item)
      ),
      item,
    ]);
  };

  return (
    <div className="space-y-4">
      <SearchInterface
        context={{
          ...context,
          selected: localSelected,
          toggleSelected: handleItemClick,
        }}
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            clearSelection();
            setLocalSelected([]);
          }}
        >
          Clear
        </Button>
        <Button onClick={onSubmit} disabled={localSelected.length === 0}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
