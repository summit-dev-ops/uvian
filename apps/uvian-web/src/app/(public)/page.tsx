'use client';

import { Button } from '@org/ui';
import { Card, CardDescription, CardHeader, CardTitle } from '@org/ui';
import { LogOut, User, MessageCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-muted/50">
      <div className="container mx-auto py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome to UVian
            </h1>
            <p className="text-xl text-muted-foreground">
              A modern chat application with powerful features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            <Card>
              <CardHeader>
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <CardTitle>Real-time Chat</CardTitle>
                <CardDescription>
                  Connect and chat with others in real-time conversations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <User className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <CardTitle>User Profiles</CardTitle>
                <CardDescription>
                  Manage your profile and personalize your experience
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <LogOut className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <CardTitle>Secure Auth</CardTitle>
                <CardDescription>
                  Secure authentication with email verification
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/sign-in">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Already have an account? Sign in to continue your conversations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
