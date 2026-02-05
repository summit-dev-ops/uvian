'use client';

import { useAuth } from '~/lib/auth/auth-context';
import { Button } from '@org/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@org/ui';
import { LogOut, User, Mail, MessageCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border border-current border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-muted/50">
        <div className="container mx-auto py-16">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome to UVian
              </h1>
              <p className="text-xl text-muted-foreground">
                A modern chat application with powerful features
              </p>
            </div>

            {/* Features */}
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

            {/* CTA */}
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

  // User is authenticated
  return (
    <div className="min-h-screen bg-muted/50">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome Home</h1>
              <p className="text-muted-foreground">
                You're successfully authenticated
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Account Information
              </CardTitle>
              <CardDescription>
                You're successfully authenticated and can access all features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-green-600 font-medium">
                  ✓ Authenticated
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Conversations
                </CardTitle>
                <CardDescription>
                  Start chatting and managing your conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/chats">
                  <Button variant="outline" className="w-full">
                    View Conversations
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your account and profile preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/profile">
                  <Button variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Here are some things you can do next
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  • Create your first conversation to start chatting
                </p>
                <p className="text-sm text-muted-foreground">
                  • Update your profile information
                </p>
                <p className="text-sm text-muted-foreground">
                  • Explore the chat features and tools
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
