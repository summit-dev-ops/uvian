'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  useIsMobile,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@org/ui';
import { SearchInterface } from './search-interface';
import { SearchResultItemData } from '../types';

export interface SearchDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: SearchResultItemData[]) => Promise<void>;
  submitPending?: boolean;
  submitError?: Error | null;
  onCancel?: (data: any) => Promise<void>;
  cancelPending?: boolean;
  cancelError?: Error | null;
}

export function SearchDialog({
  open,
  onOpenChange,
  onSubmit,
}: SearchDialogProps) {
  const isMobile = useIsMobile();
  const [localSelected, setLocalSelected] = React.useState<
    SearchResultItemData[]
  >([]);

  const handleSubmit = () => {
    onSubmit(localSelected);
    onOpenChange?.(false);
    setLocalSelected([]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setLocalSelected([]);
    }
    onOpenChange?.(isOpen);
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{'Search'}</DrawerTitle>
            <DrawerDescription className="sr-only">
              Search and select items
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 overflow-y-auto flex-1">
            <SearchInterfaceWithActions
              localSelected={localSelected}
              setLocalSelected={setLocalSelected}
              onSubmit={handleSubmit}
              submitLabel={'Done'}
            />
          </div>

          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{'Search'}</DialogTitle>
        </DialogHeader>
        <SearchInterfaceWithActions
          localSelected={localSelected}
          setLocalSelected={setLocalSelected}
          onSubmit={handleSubmit}
          submitLabel={'Done'}
        />
      </DialogContent>
    </Dialog>
  );
}

interface SearchInterfaceWithActionsProps {
  localSelected: SearchResultItemData[];
  setLocalSelected: (items: SearchResultItemData[]) => void;
  onSubmit: () => void;
  submitLabel: string;
}

function SearchInterfaceWithActions({
  localSelected,
  setLocalSelected,
  onSubmit,
  submitLabel,
}: SearchInterfaceWithActionsProps) {
  return (
    <div className="space-y-4">
      <SearchInterface />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
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
