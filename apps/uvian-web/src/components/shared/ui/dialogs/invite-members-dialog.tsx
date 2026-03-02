'use client';

import * as React from 'react';
import { UserPlus, X } from 'lucide-react';

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
import type {
  InviteMemberData,
  UserSearchResult,
} from '~/lib/domains/profile/types';

export interface InviteMembersDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: { invites: InviteMemberData[] }) => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  submitPending?: boolean;
  defaultRole?: 'admin' | 'member';
}

function GlobalUserSearchContent({
  onInvite,
  defaultRole = 'member',
}: {
  onInvite: (user: UserSearchResult, role: 'admin' | 'member') => void;
  defaultRole?: 'admin' | 'member';
}) {
  const { query, setQuery, results, isLoading, selected, toggleSelected } =
    useGlobalUserSearch();
  const [selectedRole, setSelectedRole] = React.useState<'admin' | 'member'>(
    defaultRole
  );

  const handleAdd = (user: UserSearchResult) => {
    onInvite(user, selectedRole);
    toggleSelected(user);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Role</label>
        <div className="flex gap-2">
          <Button
            variant={selectedRole === 'member' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRole('member')}
          >
            Member
          </Button>
          <Button
            variant={selectedRole === 'admin' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRole('admin')}
          >
            Admin
          </Button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search users..."
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
          <p className="text-sm text-muted-foreground">No users found</p>
        )}
        {!query && !isLoading && (
          <p className="text-sm text-muted-foreground">
            Start typing to search
          </p>
        )}
        {results.map((user) => {
          const isSelected = selected.some(
            (s) => s.profileId === user.profileId
          );
          return (
            <button
              key={user.profileId}
              type="button"
              onClick={() => handleAdd(user)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                isSelected ? 'bg-primary/10' : 'hover:bg-muted'
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.type}
                </p>
              </div>
              {isSelected && (
                <span className="text-xs text-primary font-medium">Added</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
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
  const [invites, setInvites] = React.useState<InviteMemberData[]>([]);

  const handleInvite = (user: UserSearchResult, role: 'admin' | 'member') => {
    const exists = invites.some((i) => i.profileId === user.profileId);
    if (!exists) {
      setInvites([
        ...invites,
        {
          userId: user.userId,
          profileId: user.profileId,
          displayName: user.displayName,
          role,
        },
      ]);
    }
  };

  const removeInvite = (profileId: string) => {
    setInvites(invites.filter((i) => i.profileId !== profileId));
  };

  const handleSubmit = async () => {
    if (invites.length > 0) {
      try {
        await onSubmit({ invites });
        setInvites([]);
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
        setInvites([]);
        onOpenChange?.(false);
      } catch (error) {
        console.error('Failed to cancel:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Members
          </DialogTitle>
          <DialogDescription>
            Search for users to invite to this space.
          </DialogDescription>
        </DialogHeader>

        <GlobalUserSearchProvider>
          <GlobalUserSearchContent
            onInvite={handleInvite}
            defaultRole={defaultRole}
          />
        </GlobalUserSearchProvider>

        {invites.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Users:</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {invites.map((invite) => (
                <div
                  key={invite.profileId}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {invite.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({invite.role})
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeInvite(invite.profileId)}
                    disabled={submitPending}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

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
            disabled={invites.length === 0 || submitPending}
          >
            {submitPending
              ? 'Inviting...'
              : `Invite ${invites.length} User${
                  invites.length !== 1 ? 's' : ''
                }`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
