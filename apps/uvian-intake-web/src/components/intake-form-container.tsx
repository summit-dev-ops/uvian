'use client';

import { useState } from 'react';
import { DynamicForm } from '@/components/dynamic-form';
import SignInForm from '@/components/auth/sign-in-form';
import SignUpForm from '@/components/auth/sign-up-form';
import { useAuth } from '@/lib/auth/auth-context';
import type { IntakeSchema } from '@/lib/api/types';

interface IntakeFormContainerProps {
  tokenId: string;
  schema: IntakeSchema;
}

type AuthMode = 'sign-in' | 'sign-up';

export default function IntakeFormContainer({
  tokenId,
  schema,
}: IntakeFormContainerProps) {
  const { session, loading } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent border-emerald-600" />
      </div>
    );
  }

  const needsAuth = schema.requiresAuth ?? false;
  const isAuthenticated = !!session;

  if (needsAuth && !isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <p className="text-muted-foreground">
            Please sign in to access this form
          </p>
        </div>
        {authMode === 'sign-in' ? (
          <SignInForm onSignUpClick={() => setAuthMode('sign-up')} />
        ) : (
          <SignUpForm onSignInClick={() => setAuthMode('sign-in')} />
        )}
      </div>
    );
  }

  return (
    <DynamicForm
      tokenId={tokenId}
      schema={schema}
      authToken={session?.access_token}
    />
  );
}
