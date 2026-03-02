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
import { Avatar, AvatarFallback, AvatarImage } from '@org/ui';
import {
  GlobalUserSearchProvider,
  useGlobalUserSearch,
} from '~/components/features/search';
import type { UserSearchResult } from '~/lib/domains/profile/types';
import type { ConversationMemberRole } from '~/lib/domains/chat/types';

export interface InviteProfileDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onProfileSelect?: (profile: UserSearchResult) => void;
  selectedProfiles?: UserSearchResult[];
  selectedRole?: ConversationMemberRole['name'];
  onRoleChange?: (role: ConversationMemberRole['name']) => void;
  onRemoveProfile?: (profileId: string) => void;
  onSubmit?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  submitPending?: boolean;
}

function GlobalUserSearchContent({
  onProfileSelect,
  selectedRole,
}: {
  onProfileSelect?: (profile: UserSearchResult) => void;
  selectedRole?: ConversationMemberRole['name'];
}) {
  const { query, setQuery, results, isLoading, selected, toggleSelected } =
    useGlobalUserSearch();

  const handleSelect = (profile: UserSearchResult) => {
    toggleSelected(profile);
    onProfileSelect?.(profile);
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search profiles..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 py-2 border rounded-md"
        autoFocus
      />

      <div className="max-h-[300px] overflow-y-auto space-y-2">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Searching...</p>
        )}
        {!isLoading && results.length === 0 && query && (
          <p className="text-sm text-muted-foreground">No profiles found</p>
        )}
        {!query && !isLoading && (
          <p className="text-sm text-muted-foreground">
            Start typing to search
          </p>
        )}
        {results.map((profile) => {
          const isSelected = selected.some(
            (s) => s.profileId === profile.profileId
          );
          return (
            <button
              key={profile.profileId}
              type="button"
              onClick={() => handleSelect(profile)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                isSelected ? 'bg-primary/10' : 'hover:bg-muted'
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{profile.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile.type}
                </p>
              </div>
              {isSelected && (
                <span className="text-xs text-primary font-medium">
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
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
          {hasSelectedProfiles && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Role</label>
              <div className="flex gap-2">
                <Button
                  variant={selectedRole === 'member' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onRoleChange?.('member')}
                  disabled={submitPending}
                >
                  Member
                </Button>
                <Button
                  variant={selectedRole === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onRoleChange?.('admin')}
                  disabled={submitPending}
                >
                  Admin
                </Button>
                <Button
                  variant={selectedRole === 'owner' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onRoleChange?.('owner')}
                  disabled={submitPending}
                >
                  Owner
                </Button>
              </div>
            </div>
          )}

          <GlobalUserSearchProvider>
            <GlobalUserSearchContent
              onProfileSelect={onProfileSelect}
              selectedRole={selectedRole}
            />
          </GlobalUserSearchProvider>

          {hasSelectedProfiles && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Profiles:</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedProfiles.map((profile) => (
                  <div
                    key={profile.profileId}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatarUrl || undefined} />
                        <AvatarFallback>
                          {profile.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-medium">
                          {profile.displayName}
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
                        onClick={() => onRemoveProfile?.(profile.profileId)}
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
