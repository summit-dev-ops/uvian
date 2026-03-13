'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ItemGroup } from '@org/ui';
import { useQuery } from '@tanstack/react-query';
import { accountQueries } from '~/lib/domains/accounts';
import type { AccountUI } from '~/lib/domains/accounts/types';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
  InterfaceEmpty,
  InterfaceLoadingSkeleton,
  InterfaceError,
} from '~/components/shared/ui/interfaces';

export function AccountsListInterface() {
  const router = useRouter();

  const {
    data: accounts = [],
    isLoading,
    error,
    refetch,
  } = useQuery(accountQueries.list());

  const handleViewAccount = React.useCallback(
    (account: AccountUI) => {
      router.push(`/accounts/${account.id}`);
    },
    [router]
  );

  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Accounts"
            subtitle="Error loading accounts"
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            title="Failed to Load Accounts"
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
          <InterfaceHeaderContent title="Accounts" subtitle="Loading..." />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <InterfaceLoadingSkeleton key={i} className="h-16" />
            ))}
          </div>
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Accounts"
            subtitle={`${accounts.length} account${
              accounts.length !== 1 ? 's' : ''
            }`}
          />
        </InterfaceHeader>

        <InterfaceContent spacing="default">
          {accounts.length > 0 ? (
            <ItemGroup>
              {accounts.map((account) => (
                <AccountListItem
                  key={account.id}
                  account={account}
                  onClick={() => handleViewAccount(account)}
                />
              ))}
            </ItemGroup>
          ) : (
            <InterfaceEmpty
              title="No accounts found"
              message="You don't have any accounts yet."
            />
          )}
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}

interface AccountListItemProps {
  account: AccountUI;
  onClick: () => void;
}

function AccountListItem({ account, onClick }: AccountListItemProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
    >
      <div className="flex flex-col">
        <span className="font-medium">{account.name || 'Unnamed Account'}</span>
        <span className="text-sm text-muted-foreground">
          Created {new Date(account.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
