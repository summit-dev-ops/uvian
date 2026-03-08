'use client';

import * as React from 'react';
import { MessageCircle } from 'lucide-react';

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
import { ContactForm } from '~/components/features/support/components/forms/contact-form';
import type { ContactFormData } from '~/components/features/support/components/forms/contact-form';

export interface ContactSupportDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: ContactFormData) => Promise<void>;
  submitPending?: boolean;
  submitError?: Error | null;
  onCancel?: (data: unknown) => Promise<void>;
}

export function ContactSupportDialog({
  children,
  open,
  onOpenChange,
  onSubmit,
  submitPending,
  onCancel,
}: ContactSupportDialogProps) {
  const isMobile = useIsMobile();

  const handleSubmit = async (data: ContactFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit contact form:', error);
    }
    onOpenChange?.(false);
  };

  const handleCancel = async () => {
    if (!submitPending) {
      try {
        if (onCancel) {
          await onCancel({});
        }
        onOpenChange?.(false);
      } catch (error) {
        console.error('Failed to cancel:', error);
      }
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
              <MessageCircle className="h-5 w-5" />
              Contact Support
            </DrawerTitle>
            <DrawerDescription>
              Send us a message and we'll get back to you as soon as possible.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 overflow-y-auto flex-1">
            <ContactForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={submitPending}
              showCancel={true}
            />
          </div>

          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={submitPending}
              >
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Contact Support
          </DialogTitle>
          <DialogDescription>
            Send us a message and we'll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        <ContactForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitPending}
          showCancel={true}
        />
      </DialogContent>
    </Dialog>
  );
}
