'use client';

/**
 * Support Interface Component
 *
 * Main interface for the Support feature, providing comprehensive
 * access to FAQ content, search functionality, and support resources.
 */

import * as React from 'react';
import {
  HelpCircle,
  Search,
  BookOpen,
  MessageCircle,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { SupportSearchInterface } from './support-search-interface';
import { Button } from '@org/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@org/ui';
import { ScrollArea } from '@org/ui';
import type { SupportUI } from '~/lib/domains/support/types';

export interface SupportInterfaceProps {
  // Configuration
  showSearch?: boolean;
  showQuickActions?: boolean;
  showHelpfulResources?: boolean;
  defaultView?: 'search' | 'faq' | 'resources';

  // Callbacks
  onResultSelect?: (result: SupportUI) => void;
  onContactSupport?: () => void;
  onBrowseCategory?: (category: string) => void;

  // Styling
  className?: string;
}

export function SupportInterface({
  showSearch = true,
  showQuickActions = true,
  showHelpfulResources = true,
  defaultView = 'search',
  onResultSelect,
  onContactSupport,
  onBrowseCategory,
  className,
}: SupportInterfaceProps) {
  const [activeView, setActiveView] = React.useState<
    'search' | 'faq' | 'resources'
  >(defaultView);
  const [selectedResult, setSelectedResult] = React.useState<SupportUI | null>(
    null
  );

  const handleResultSelect = (result: SupportUI) => {
    setSelectedResult(result);
    onResultSelect?.(result);
  };

  const handleBrowseCategory = (category: string) => {
    onBrowseCategory?.(category);
  };

  const handleContactSupport = () => {
    onContactSupport?.();
  };

  return (
    <ScrollArea className="flex-1">
      <div className={`space-y-6 p-6 ${className || ''}`}>
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to your questions, learn how to use Uvian features, and
            get help when you need it.
          </p>
        </div>

        {/* View Navigation */}
        {showQuickActions && (
          <div className="flex justify-center">
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={activeView === 'search' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('search')}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search Help
              </Button>
              <Button
                variant={activeView === 'faq' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('faq')}
                className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Browse FAQ
              </Button>
              <Button
                variant={activeView === 'resources' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('resources')}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Resources
              </Button>
            </div>
          </div>
        )}

        {/* Quick Actions Bar */}
        {showQuickActions && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={handleContactSupport}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Contact Support
                </CardTitle>
                <CardDescription>
                  Get direct help from our support team
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleBrowseCategory('getting-started')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Getting Started
                </CardTitle>
                <CardDescription>New to Uvian? Start here</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleBrowseCategory('troubleshooting')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Troubleshooting
                </CardTitle>
                <CardDescription>Fix common issues</CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Search Interface */}
        {showSearch && activeView === 'search' && (
          <div className="max-w-4xl mx-auto">
            <SupportSearchInterface
              onResultSelect={handleResultSelect}
              showCategoryFilter={true}
              showResultsCount={true}
              showEmptyState={true}
            />
          </div>
        )}

        {/* FAQ Categories */}
        {activeView === 'faq' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Browse by Category</h2>
              <p className="text-muted-foreground">
                Explore our most frequently asked questions organized by topic
              </p>
            </div>

            <FAQCategories onBrowseCategory={handleBrowseCategory} />
          </div>
        )}

        {/* Helpful Resources */}
        {showHelpfulResources && activeView === 'resources' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Helpful Resources</h2>
              <p className="text-muted-foreground">
                Additional resources to help you get the most out of Uvian
              </p>
            </div>

            <HelpfulResources onContactSupport={handleContactSupport} />
          </div>
        )}

        {/* Selected Result Modal */}
        {selectedResult && (
          <FAQModal
            result={selectedResult}
            onClose={() => setSelectedResult(null)}
          />
        )}
      </div>
    </ScrollArea>
  );
}

// FAQ Categories Component
interface FAQCategoriesProps {
  onBrowseCategory: (category: string) => void;
}

function FAQCategories({ onBrowseCategory }: FAQCategoriesProps) {
  const categories = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Basic guides and setup instructions',
      icon: '🚀',
      faqCount: 12,
      color: 'bg-blue-50 border-blue-200',
    },
    {
      id: 'account',
      name: 'Account & Profile',
      description: 'Manage your account settings and profile',
      icon: '👤',
      faqCount: 8,
      color: 'bg-green-50 border-green-200',
    },
    {
      id: 'spaces',
      name: 'Spaces & Collaboration',
      description: 'Work together in shared spaces',
      icon: '🏢',
      faqCount: 15,
      color: 'bg-purple-50 border-purple-200',
    },
    {
      id: 'chats',
      name: 'Chats & Messaging',
      description: 'Send messages and start conversations',
      icon: '💬',
      faqCount: 10,
      color: 'bg-orange-50 border-orange-200',
    },
    {
      id: 'jobs',
      name: 'Jobs & Opportunities',
      description: 'Find and manage job opportunities',
      icon: '💼',
      faqCount: 7,
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      id: 'features',
      name: 'Features & Tips',
      description: 'Learn about Uvian features',
      icon: '⭐',
      faqCount: 20,
      color: 'bg-yellow-50 border-yellow-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <Card
          key={category.id}
          className={`cursor-pointer hover:shadow-md transition-shadow ${category.color}`}
          onClick={() => onBrowseCategory(category.id)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{category.icon}</span>
                {category.name}
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {category.faqCount} articles
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Helpful Resources Component
interface HelpfulResourcesProps {
  onContactSupport: () => void;
}

function HelpfulResources({ onContactSupport }: HelpfulResourcesProps) {
  const resources = [
    {
      title: 'Getting Started Guide',
      description: 'Step-by-step walkthrough for new users',
      icon: BookOpen,
      action: () => {
        // TODO: Implement getting started guide
        console.log('Getting started guide clicked');
      },
    },
    {
      title: 'Video Tutorials',
      description: 'Watch how-to videos for key features',
      icon: FileText,
      action: () => {
        // TODO: Implement video tutorials functionality
        console.log('Video tutorials clicked');
      },
    },
    {
      title: 'Keyboard Shortcuts',
      description: 'Speed up your workflow with shortcuts',
      icon: HelpCircle,
      action: () => {
        // TODO: Implement keyboard shortcuts display
        console.log('Keyboard shortcuts clicked');
      },
    },
    {
      title: 'API Documentation',
      description: 'Developer resources and API reference',
      icon: ExternalLink,
      action: () => {
        // TODO: Implement API documentation link
        console.log('API documentation clicked');
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {resources.map((resource) => {
        const IconComponent = resource.icon;
        return (
          <Card
            key={resource.title}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <IconComponent className="h-5 w-5 text-primary" />
                {resource.title}
              </CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={resource.action}>
                Learn More
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// FAQ Modal Component
interface FAQModalProps {
  result: SupportUI;
  onClose: () => void;
}

function FAQModal({ result, onClose }: FAQModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{result.question}</h2>
              <span className="inline-flex items-center px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded">
                {result.category}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{result.answer}</p>
          </div>

          {result.tags.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Tags:</h4>
              <div className="flex flex-wrap gap-1">
                {result.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs bg-muted text-muted-foreground rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {result.helpful && (
                  <span>👍 {result.helpful} found this helpful</span>
                )}
                {result.views && <span>👀 {result.views} views</span>}
              </div>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
