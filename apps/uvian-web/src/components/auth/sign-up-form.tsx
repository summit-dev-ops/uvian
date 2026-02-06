'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
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
import { signUpSchema, type SignUpFormData } from '~/lib/auth/schemas';
import { createClient } from '~/lib/supabase/client';

export default function SignUpForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Redirect to confirmation page after a short delay
        setTimeout(() => {
          router.push('/auth/confirm-sign-up');
        }, 2000);
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
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">
              Check Your Email
            </CardTitle>
            <CardDescription>
              We've sent you a confirmation link at your email address. Please
              click the link to verify your account.
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
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Enter your email and password to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="sign-up-form" onSubmit={form.handleSubmit(onSubmit)}>
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/5 border-destructive/30 rounded-md flex items-center space-x-2 mb-4">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sign-up-form-email">Email</FieldLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        id="sign-up-form-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        aria-invalid={fieldState.invalid}
                        autoComplete="email"
                      />
                    </div>
                    <FieldDescription>
                      We'll use this to send you a confirmation email.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sign-up-form-password">
                      Password
                    </FieldLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        id="sign-up-form-password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        aria-invalid={fieldState.invalid}
                        autoComplete="new-password"
                      />
                    </div>
                    <FieldDescription>
                      Password must be at least 8 characters long.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sign-up-form-confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        id="sign-up-form-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10"
                        aria-invalid={fieldState.invalid}
                        autoComplete="new-password"
                      />
                    </div>
                    <FieldDescription>
                      Please confirm your password.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button
              type="submit"
              form="sign-up-form"
              className="w-full mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-t-transparent border-current/40 mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Create Account
            </Button>

            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => router.push('/auth/sign-in')}
                >
                  Sign in
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
