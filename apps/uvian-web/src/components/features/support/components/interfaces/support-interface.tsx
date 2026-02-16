'use client';

/**
 * Support Interface Component
 *
 * Simplified support landing page using InterfaceLayout patterns with
 * quick actions and clear navigation to dedicated support pages.
 */

import * as React from 'react';
import {
  MessageCircle,
  BookOpen,
  Search,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import {
  InterfaceContainer,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceSection,
  InterfaceLayout,
} from '~/components/shared/ui/interfaces';
import { Button } from '@org/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@org/ui';
import Link from 'next/link';

export interface SupportInterfaceProps {
  className?: string;
}

export function SupportInterface({ className }: SupportInterfaceProps) {
  return (
    <InterfaceLayout>
      <InterfaceContainer className={className}>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Support Center"
            subtitle="Find answers to your questions, learn how to use Uvian features, and get help when you need it"
          />
        </InterfaceHeader>

        <InterfaceContent>
          <InterfaceSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Contact Support
                  </CardTitle>
                  <CardDescription>
                    Get direct help from our support team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href={'/support/contact'}>
                      Contact Us
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Getting Started */}
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>
                    New to Uvian? Start here with our guides
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={'/support/faq?category=getting-started'}>
                      Start Guide
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Search FAQ */}
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Search Help
                  </CardTitle>
                  <CardDescription>
                    Find answers quickly with our search
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={'/support/search'}>
                      Search
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </InterfaceSection>

          <InterfaceSection>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4 mt-6">
                Browse Support Topics
              </h3>
              <p className="text-muted-foreground mb-6">
                Explore frequently asked questions organized by category
              </p>
              <Button asChild>
                <Link href={'/support/faq'}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Browse FAQ
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </InterfaceSection>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
