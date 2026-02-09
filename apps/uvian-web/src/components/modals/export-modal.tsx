'use client';

import * as React from 'react';
import { Download } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@org/ui';
import { Button } from '@org/ui';

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
  const [isExporting, setIsExporting] = React.useState(false);
  const [selectedFormat, setSelectedFormat] = React.useState('json');

  const handleExport = async (format: string) => {
    setIsExporting(true);
    try {
      if (onExport) {
        onExport(format);
      } else {
        // Default export behavior
        const response = await fetch(
          `/api/conversations/${conversationId}/export?format=${format}`
        );
        if (!response.ok) {
          throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `conversation-${conversationId}-${
          new Date().toISOString().split('T')[0]
        }.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      // TODO: Show error toast
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    if (!isExporting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Conversation
          </DialogTitle>
          <DialogDescription>
            Choose the format for exporting this conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Export Format</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="json"
                  checked={selectedFormat === 'json'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="form-radio"
                  disabled={isExporting}
                />
                <span className="text-sm">JSON (recommended)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="txt"
                  checked={selectedFormat === 'txt'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="form-radio"
                  disabled={isExporting}
                />
                <span className="text-sm">Plain Text</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="csv"
                  checked={selectedFormat === 'csv'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="form-radio"
                  disabled={isExporting}
                />
                <span className="text-sm">CSV (messages only)</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleExport(selectedFormat)}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
