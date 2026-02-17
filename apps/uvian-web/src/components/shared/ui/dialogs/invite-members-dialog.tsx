'use client';

import * as React from 'react';
import { Mail } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@org/ui';
import { Button } from '@org/ui';
import { Input } from '@org/ui';
import { Field, FieldLabel } from '@org/ui';

export type InviteMemberData = {
  email: string;
  role: 'admin' | 'member';
};

export interface InviteMembersDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: { invites: InviteMemberData[] }) => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  submitPending?: boolean;
  defaultRole?: 'admin' | 'member';
}

export function InviteMembersDialog({
  children,
  open,
  onOpenChange,
  onSubmit,
  onCancel,
  submitPending,
  defaultRole = 'member',
}: InviteMembersDialogProps) {
  const [email, setEmail] = React.useState('');
  const [invites, setInvites] = React.useState<InviteMemberData[]>([]);

  const handleSubmit = async () => {
    if (!email.trim()) return;

    const newInvite: InviteMemberData = {
      email: email.trim(),
      role: defaultRole,
    };

    const updatedInvites = [...invites, newInvite];
    setInvites(updatedInvites);
    setEmail('');

    if (updatedInvites.length > 0) {
      try {
        await onSubmit({ invites: updatedInvites });
        onOpenChange?.(false);
      } catch (error) {
        console.error('Failed to invite members:', error);
      }
    }
  };

  const handleCancel = async () => {
    if (!submitPending) {
      try {
        if (onCancel) {
          await onCancel();
        }
        onOpenChange?.(false);
      } catch (error) {
        console.error('Failed to cancel member invitation:', error);
      }
    }
  };

  const removeInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {onOpenChange === undefined && (
        <DialogTrigger asChild>{children}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Members
          </DialogTitle>
          <DialogDescription>
            Invite team members to this space. They will receive an email
            invitation.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Field>
              <FieldLabel>Email Address</FieldLabel>
              <Input
                type="email"
                placeholder="Enter email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && email.trim()) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={submitPending}
              />
            </Field>
          </div>

          {/* Add Button */}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!email.trim() || submitPending}
            className="w-full"
          >
            Add Invitation
          </Button>

          {/* Invitations List */}
          {invites.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Pending Invitations:</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {invites.map((invite, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <span className="text-sm">{invite.email}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({invite.role})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeInvite(index)}
                      disabled={submitPending}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={submitPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit({ invites })}
            disabled={invites.length === 0 || submitPending}
          >
            {submitPending
              ? 'Sending...'
              : `Send ${invites.length} Invitation${
                  invites.length !== 1 ? 's' : ''
                }`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
