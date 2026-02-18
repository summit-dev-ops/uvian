'use client';

import * as React from 'react';
import { Mail, X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@org/ui';
import { Button } from '@org/ui';
import { ProfileSearchInterface } from '../../../features/profiles/components/interfaces/profile-search-interface';
import type { ProfileUI } from '~/lib/domains/profile/types';
import type { ConversationMemberRole } from '~/lib/domains/chat/types';

export interface InviteProfileDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // New props for enhanced functionality
  onProfileSelect?: (profile: ProfileUI) => void;
  selectedProfiles?: ProfileUI[];
  selectedRole?: ConversationMemberRole['name'];
  onRoleChange?: (role: ConversationMemberRole['name']) => void;
  onRemoveProfile?: (profileId: string) => void;
  onSubmit?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  submitPending?: boolean;
}

export function InviteProfileDialog({
  children,
  open,
  onOpenChange,
  onProfileSelect,
  selectedProfiles = [],
  selectedRole = 'member',
  onRoleChange,
  onRemoveProfile,
  onSubmit,
  onCancel,
  submitPending = false,
}: InviteProfileDialogProps) {
  const hasSelectedProfiles = selectedProfiles.length > 0;

  const handleSubmit = async () => {
    if (onSubmit && hasSelectedProfiles) {
      await onSubmit();
    }
  };

  const handleCancel = async () => {
    if (onCancel) {
      await onCancel();
    }
  };

  const handleRoleChange = (role: ConversationMemberRole['name']) => {
    if (onRoleChange) {
      onRoleChange(role);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {onOpenChange === undefined && (
        <DialogTrigger asChild>{children}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Members
          </DialogTitle>
          <DialogDescription>
            Search for profiles and select them to invite to this conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Role Selection */}
          {hasSelectedProfiles && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Role</label>
              <div className="flex gap-2">
                <Button
                  variant={selectedRole === 'member' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRoleChange('member')}
                  disabled={submitPending}
                >
                  Member
                </Button>
                <Button
                  variant={selectedRole === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRoleChange('admin')}
                  disabled={submitPending}
                >
                  Admin
                </Button>
                <Button
                  variant={selectedRole === 'owner' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRoleChange('owner')}
                  disabled={submitPending}
                >
                  Owner
                </Button>
              </div>
            </div>
          )}

          {/* Profile Search */}
          <div className="space-y-4">
            <ProfileSearchInterface onProfileSelect={onProfileSelect} />
          </div>

          {/* Selected Profiles */}
          {hasSelectedProfiles && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Profiles:</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {profile.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          {profile.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {profile.id}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        ({selectedRole})
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveProfile?.(profile.id)}
                        disabled={submitPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={submitPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasSelectedProfiles || submitPending}
          >
            {submitPending
              ? 'Inviting...'
              : `Invite ${selectedProfiles.length} Profile${
                  selectedProfiles.length !== 1 ? 's' : ''
                }`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
