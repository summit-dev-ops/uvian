'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Mail, Loader2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@org/ui';
import { createClient } from '~/lib/supabase/client';

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ResetPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setEmailError(null);

    try {
      const result = resetPasswordSchema.safeParse({ email });
      if (!result.success) {
        setEmailError(
          result.error.issues[0]?.message || 'Invalid email address'
        );
        setIsSubmitting(false);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Check Your Email
            </CardTitle>
            <CardDescription>
              We've sent a password reset link to <strong>{email}</strong>.
              Click the link in the email to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/auth/sign-in')}
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your
            password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/5 border-destructive/30 rounded-md">
                {error}
              </div>
            )}

            <FieldGroup>
              <Field data-invalid={!!emailError}>
                <FieldLabel htmlFor="reset-password-email">Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-password-email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!emailError}
                    autoComplete="email"
                  />
                </div>
                <FieldDescription>
                  We'll send a password reset link to this email address.
                </FieldDescription>
                {emailError && (
                  <FieldError errors={[{ message: emailError }]} />
                )}
              </Field>
            </FieldGroup>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reset Link
                </>
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => router.push('/auth/sign-in')}
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
