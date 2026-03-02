'use client';

import { Suspense } from 'react';
import ConfirmSignUpForm from '~/components/auth/confirm-sign-up-form';

function ConfirmSignUpFormWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/50">
          Loading...
        </div>
      }
    >
      <ConfirmSignUpForm />
    </Suspense>
  );
}

export default function ConfirmSignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <ConfirmSignUpFormWithSuspense />
    </div>
  );
}
