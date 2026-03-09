'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { accountQueries } from '~/lib/domains/accounts';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
  InterfaceError,
} from '~/components/shared/ui/interfaces';
import { Button } from '@org/ui';
import { Settings, Users } from 'lucide-react';

interface AccountInterfaceProps {
  accountId: string;
}

export function AccountInterface({ accountId }: AccountInterfaceProps) {
  const router = useRouter();

  const {
    data: account,
    isLoading,
    error,
    refetch,
  } = useQuery(accountQueries.account(accountId));

  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Account"
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

  if (isLoading || !account) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Account" subtitle="Loading..." />
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
            title={account.name || 'Unnamed Account'}
            subtitle="Account details"
            actions={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/accounts/${accountId}/members`)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Members
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/accounts/${accountId}/edit`)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
            }
          />
        </InterfaceHeader>

        <InterfaceContent spacing="default">
          <div className="grid gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Account Name
              </h3>
              <p>{account.name || 'Unnamed Account'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Created
              </h3>
              <p>{new Date(account.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Last Updated
              </h3>
              <p>{new Date(account.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
