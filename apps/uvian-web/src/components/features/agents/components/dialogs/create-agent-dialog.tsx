'use client';

import * as React from 'react';
import { Bot } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  useIsMobile,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@org/ui';
import { AgentForm } from '../forms/agent-form';

export interface CreateAgentDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description: string;
    subscribed_events: string[];
  }) => Promise<void>;
  submitPending?: boolean;
  submitError?: Error | null;
  onCancel?: () => void;
}

export function CreateAgentDialog({
  children,
  open,
  onOpenChange,
  onSubmit,
  submitPending,
  submitError,
  onCancel,
}: CreateAgentDialogProps) {
  const isMobile = useIsMobile();

  const handleSubmit = async (data: {
    name: string;
    description: string;
    subscribed_events: string[];
  }) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    if (!submitPending) {
      onCancel?.();
      onOpenChange?.(false);
    }
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {open === undefined && (
          <DrawerTrigger asChild>{children}</DrawerTrigger>
        )}
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Create New Agent
            </DrawerTitle>
            <DrawerDescription>
              Configure your new automated agent.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 overflow-y-auto flex-1">
            <AgentForm
              onSubmit={handleSubmit}
              isLoading={submitPending}
              error={submitError}
              onCancel={handleCancel}
              showCancel={!!onCancel}
            />
          </div>

          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline" disabled={submitPending}>
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {onOpenChange === undefined && (
        <DialogTrigger asChild>{children}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Create New Agent
          </DialogTitle>
          <DialogDescription>
            Configure your new automated agent.
          </DialogDescription>
        </DialogHeader>

        <AgentForm
          onSubmit={handleSubmit}
          isLoading={submitPending}
          error={submitError}
          onCancel={handleCancel}
          showCancel={!!onCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
