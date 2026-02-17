'use client';

import * as React from 'react';
import { ExportDialog } from '../../dialogs';

export interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  onExport?: (format: string) => void;
}

export function ExportModal({
  open,
  onOpenChange,
  conversationId,
  onExport,
}: ExportModalProps) {
  return (
    <ExportDialog
      open={open}
      onOpenChange={onOpenChange}
      conversationId={conversationId}
      onExport={onExport}
    />
  );
}
