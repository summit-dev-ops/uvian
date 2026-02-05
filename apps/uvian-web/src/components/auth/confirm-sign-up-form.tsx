'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@org/ui';
import { FieldGroup } from '@org/ui';
import { createClient } from '~/lib/supabase/client';

const supabase = createClient();

export default function ConfirmSignUpForm() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the tokens from URL parameters (Supabase sends these via email)
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');

        if (type === 'signup' && accessToken && refreshToken) {
          // Exchange the tokens for a session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          setStatus('success');
          setMessage('Your email has been verified successfully!');

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(
            'Invalid verification link. Please check your email for the correct link.'
          );
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error.message || 'An error occurred during email verification.'
        );
      }
    };

    handleEmailConfirmation();
  }, [searchParams, router]);

  const handleReturnToSignIn = () => {
    router.push('/auth/sign-in');
  };

  if (status === 'loading') {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <Loader className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <CardTitle className="text-2xl font-bold">
              Verifying Email
            </CardTitle>
            <CardDescription>
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">
              Email Verified!
            </CardTitle>
            <CardDescription>
              {message} Redirecting you to the dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">
            Verification Failed
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleReturnToSignIn}
              >
                Back to Sign In
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn't receive the email? Check your spam folder or try
                  signing up again.
                </p>
                <Button
                  variant="link"
                  className="text-sm"
                  onClick={() => router.push('/auth/sign-up')}
                >
                  Create New Account
                </Button>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
