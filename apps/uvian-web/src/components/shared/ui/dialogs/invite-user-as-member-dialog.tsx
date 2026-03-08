'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';

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
import { GlobalUserSearchProvider } from '~/components/features/search/providers';
import { SearchInterface } from '../search/components';
import { SelectionProvider } from '../search/contexts/search-selection-context';
import { SearchResultItemData } from '../search/types';
import { SelectionDisplay } from '../search/components/selection-display';
import type { UserSearchParams } from '~/lib/domains/profile/types';

export interface InviteUserAsMemberDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultRole?: 'admin' | 'member';
  onSubmit?: (
    members: Array<{
      userId: string;
      profileId: string;
      displayName: string;
      role: 'admin' | 'member';
    }>
  ) => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  submitPending?: boolean;
  searchContext?: UserSearchParams['searchContext'];
}

export function InviteUserAsMemberDialog({
  children,
  open,
  onOpenChange,
  defaultRole = 'member',
  onSubmit,
  onCancel,
  submitPending = false,
  searchContext,
}: InviteUserAsMemberDialogProps) {
  const isMobile = useIsMobile();
  const [selectedItems, setSelectedItems] = React.useState<
    SearchResultItemData[]
  >([]);
  const [selectedRole, setSelectedRole] = React.useState<'admin' | 'member'>(
    defaultRole
  );
  const hasSelectedMembers = selectedItems.length > 0;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedItems([]);
      setSelectedRole(defaultRole);
    }
    onOpenChange?.(isOpen);
  };

  const handleSubmit = async () => {
    if (onSubmit && hasSelectedMembers) {
      const members = selectedItems.map((item) => ({
        userId: item.key,
        profileId: item.content.profileId,
        displayName: item.content.displayName,
        role: selectedRole,
      }));
      await onSubmit(members);
    }
  };

  const handleCancel = async () => {
    setSelectedItems([]);
    setSelectedRole(defaultRole);
    if (onCancel) {
      await onCancel();
    }
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        {open === undefined && (
          <DrawerTrigger asChild>{children}</DrawerTrigger>
        )}
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Members
            </DrawerTitle>
            <DrawerDescription>
              Search for users and select them to invite as members.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 overflow-y-auto flex-1 py-4 space-y-6">
            {hasSelectedMembers && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedRole === 'member' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRole('member')}
                    disabled={submitPending}
                  >
                    Member
                  </Button>
                  <Button
                    variant={selectedRole === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRole('admin')}
                    disabled={submitPending}
                  >
                    Admin
                  </Button>
                </div>
              </div>
            )}

            <GlobalUserSearchProvider searchContext={searchContext}>
              <SelectionProvider
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                keyExtractor={(item: SearchResultItemData) => item.key}
                mode="multiple-choice"
              >
                <SearchInterface>
                  <SelectionDisplay />
                </SearchInterface>
              </SelectionProvider>
            </GlobalUserSearchProvider>

            {hasSelectedMembers && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  Selected: {selectedItems.length} member
                  {selectedItems.length !== 1 ? 's' : ''}
                </h4>
              </div>
            )}
          </div>

          <DrawerFooter className="flex-row justify-end gap-2">
            <DrawerClose asChild>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={submitPending}
              >
                Cancel
              </Button>
            </DrawerClose>
            <Button
              onClick={handleSubmit}
              disabled={!hasSelectedMembers || submitPending}
            >
              {submitPending
                ? 'Inviting...'
                : `Invite ${selectedItems.length} Member${
                    selectedItems.length !== 1 ? 's' : ''
                  }`}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {open === undefined && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Members
          </DialogTitle>
          <DialogDescription>
            Search for users and select them to invite as members.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {hasSelectedMembers && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <div className="flex gap-2">
                <Button
                  variant={selectedRole === 'member' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRole('member')}
                  disabled={submitPending}
                >
                  Member
                </Button>
                <Button
                  variant={selectedRole === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRole('admin')}
                  disabled={submitPending}
                >
                  Admin
                </Button>
              </div>
            </div>
          )}

          <GlobalUserSearchProvider searchContext={searchContext}>
            <SelectionProvider
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              keyExtractor={(item: SearchResultItemData) => item.key}
              mode="multiple-choice"
            >
              <SearchInterface>
                <SelectionDisplay />
              </SearchInterface>
            </SelectionProvider>
          </GlobalUserSearchProvider>

          {hasSelectedMembers && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                Selected: {selectedItems.length} member
                {selectedItems.length !== 1 ? 's' : ''}
              </h4>
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
            disabled={!hasSelectedMembers || submitPending}
          >
            {submitPending
              ? 'Inviting...'
              : `Invite ${selectedItems.length} Member${
                  selectedItems.length !== 1 ? 's' : ''
                }`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
