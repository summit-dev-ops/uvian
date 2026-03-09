'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountQueries, accountMutations } from '~/lib/domains/accounts';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
  InterfaceError,
} from '~/components/shared/ui/interfaces';
import { Button, Input } from '@org/ui';
import { ArrowLeft } from 'lucide-react';

interface AccountEditInterfaceProps {
  accountId: string;
}

export function AccountEditInterface({ accountId }: AccountEditInterfaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');

  const {
    data: account,
    isLoading,
    error,
    refetch,
  } = useQuery(accountQueries.account(accountId));

  React.useEffect(() => {
    if (account) {
      setName(account.name || '');
    }
  }, [account]);

  const { mutate: updateAccount, isPending } = useMutation(
    accountMutations.update(queryClient)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAccount(
      { accountId, payload: { name } },
      {
        onSuccess: () => {
          router.push(`/accounts/${accountId}`);
        },
      }
    );
  };

  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Edit Account"
            subtitle="Error loading account"
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            title="Failed to Load Account"
            message={error.message || 'Something went wrong. Please try again.'}
            showRetry={true}
            onRetry={() => refetch()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Edit Account" subtitle="Loading..." />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <div className="animate-pulse h-32 bg-muted rounded-lg" />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Edit Account"
            subtitle="Update account settings"
          />
        </InterfaceHeader>

        <InterfaceContent spacing="default">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Account Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter account name"
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/accounts/${accountId}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
