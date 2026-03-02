'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@org/ui';
import { AssetPicker } from '../asset-picker';
import type { AssetUI } from '~/lib/domains/assets';

export interface AssetPickerDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (asset: AssetUI) => void;
  selectedAssetId?: string;
  className?: string;
}

export function AssetPickerDialog({
  children,
  open,
  onOpenChange,
  onSelect,
  selectedAssetId,
  className,
}: AssetPickerDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleSelect = (asset: AssetUI) => {
    onSelect?.(asset);
    handleOpenChange(false);
  };

  const handleClose = () => {
    handleOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px] h-[500px]">
        <DialogTitle className="sr-only">Attach Asset</DialogTitle>
        <DialogDescription className="sr-only">
          Select an image or file to attach
        </DialogDescription>
        <AssetPicker
          onSelect={handleSelect}
          onClose={handleClose}
          selectedAssetId={selectedAssetId}
          className={className}
        />
      </DialogContent>
    </Dialog>
  );
}
