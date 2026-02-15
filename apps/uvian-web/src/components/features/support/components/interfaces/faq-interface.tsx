'use client';

/**
 * FAQ Interface Component
 *
 * Dedicated FAQ browsing interface showing categorized questions
 * and answers for users to browse without search.
 */

import * as React from 'react';
import {
  BookOpen,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Clock,
} from 'lucide-react';
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

export interface FAQInterfaceProps {
  // Configuration
  defaultCategory?: string;
  showPopular?: boolean;
  showRecent?: boolean;
  showCategories?: boolean;

  // Callbacks
  onQuestionSelect?: (question: SupportUI) => void;
  onCategorySelect?: (category: string) => void;
  onContactSupport?: () => void;

  // Styling
  className?: string;
}

export function FAQInterface({
  defaultCategory = 'all',
  showPopular = true,
  showRecent = true,
  showCategories = true,
  onQuestionSelect,
  onCategorySelect,
  onContactSupport,
  className,
}: FAQInterfaceProps) {
  const [selectedCategory, setSelectedCategory] =
    React.useState<string>(defaultCategory);
  const [expandedQuestions, setExpandedQuestions] = React.useState<Set<string>>(
    new Set()
  );

  // Sample FAQ data - in real implementation this would come from the API
  const faqData: SupportUI[] = [
    {
      id: '1',
      question: 'How do I start a new conversation?',
      answer:
        'To start a new conversation, click on the "New Chat" button in the Chats section. You can choose to create a direct conversation with another user or start a group conversation in a space.',
      category: 'Getting Started',
      tags: ['chats', 'getting-started', 'conversations'],
      helpful: 45,
      views: 156,
    },
    {
      id: '2',
      question: 'How do I invite someone to a space?',
      answer:
        'Navigate to the space you want to invite someone to, click on "Members" and then "Invite Members". You can search for users by name or email and send them an invitation.',
      category: 'Spaces',
      tags: ['spaces', 'invitations', 'members'],
      helpful: 32,
      views: 89,
    },
    {
      id: '3',
      question: 'What are the different job types available?',
      answer:
        'Uvian supports various job types including full-time, part-time, contract, and freelance positions. Each job type has different requirements and payment structures.',
      category: 'Jobs',
      tags: ['jobs', 'job-types', 'employment'],
      helpful: 28,
      views: 67,
    },
    {
      id: '4',
      question: 'How do I update my profile information?',
      answer:
        'Go to Settings > Profile to update your personal information, skills, experience, and other profile details. Changes are saved automatically.',
      category: 'Account',
      tags: ['profile', 'settings', 'account'],
      helpful: 56,
      views: 234,
    },
    {
      id: '5',
      question: 'How does the search functionality work?',
      answer:
        'The search function uses intelligent matching to find relevant content across profiles, spaces, conversations, and jobs. You can filter results by type and use advanced search operators.',
      category: 'Features',
      tags: ['search', 'features', 'navigation'],
      helpful: 19,
      views: 43,
    },
    {
      id: '6',
      question: 'Can I delete my account?',
      answer:
        'Yes, you can delete your account from Settings > Account > Delete Account. Please note that this action is irreversible and will permanently remove all your data from Uvian.',
      category: 'Account',
      tags: ['account', 'delete', 'privacy'],
      helpful: 23,
      views: 78,
    },
  ];

  const categories = [
    { id: 'all', name: 'All Topics', count: faqData.length, icon: '📋' },
    { id: 'getting-started', name: 'Getting Started', count: 12, icon: '🚀' },
    { id: 'account', name: 'Account & Profile', count: 8, icon: '👤' },
    { id: 'spaces', name: 'Spaces & Collaboration', count: 15, icon: '🏢' },
    { id: 'chats', name: 'Chats & Messaging', count: 10, icon: '💬' },
    { id: 'jobs', name: 'Jobs & Opportunities', count: 7, icon: '💼' },
    { id: 'features', name: 'Features & Tips', count: 20, icon: '⭐' },
    { id: 'troubleshooting', name: 'Troubleshooting', count: 6, icon: '🔧' },
  ];

  const filteredFAQ =
    selectedCategory === 'all'
      ? faqData
      : faqData.filter(
          (item) =>
            item.category.toLowerCase() === selectedCategory.replace('-', ' ')
        );

  const popularFAQ = faqData
    .filter((item) => (item.helpful || 0) > 30)
    .slice(0, 5);
  const recentFAQ = faqData.slice(0, 3);

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategorySelect?.(categoryId);
  };

  return (
    <ScrollArea className="flex-1">
      <div className={`space-y-6 p-6 ${className || ''}`}>
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about using Uvian. Browse by
            category or search for specific topics.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(1, 5).map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleCategorySelect(category.id)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">{category.icon}</div>
                <div className="text-sm font-medium">{category.name}</div>
                <div className="text-xs text-muted-foreground">
                  {category.count} articles
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Popular Questions */}
        {showPopular && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-primary" />
              Most Helpful
            </h2>
            <div className="grid gap-3">
              {popularFAQ.map((item) => (
                <Card
                  key={item.id}
                  className="hover:bg-accent/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.question}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{item.helpful} helpful</span>
                          <span>{item.views} views</span>
                          <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onQuestionSelect?.(item)}
                      >
                        Read
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Category Navigation */}
        {showCategories && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Browse by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? 'default' : 'outline'
                  }
                  onClick={() => handleCategorySelect(category.id)}
                  className="h-auto p-4 flex-col"
                >
                  <div className="text-lg mb-1">{category.icon}</div>
                  <div className="text-xs font-medium text-center">
                    {category.name}
                  </div>
                  <div className="text-xs opacity-70">
                    {category.count} articles
                  </div>
                </Button>
              ))}
            </div>
          </section>
        )}

        {/* FAQ List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {selectedCategory === 'all'
                ? 'All Questions'
                : categories.find((c) => c.id === selectedCategory)?.name}
            </h2>
            <div className="text-sm text-muted-foreground">
              {filteredFAQ.length} questions
            </div>
          </div>

          <div className="space-y-3">
            {filteredFAQ.map((item) => {
              const isExpanded = expandedQuestions.has(item.id);
              return (
                <Card key={item.id}>
                  <CardHeader
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => toggleQuestion(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-left">
                        <CardTitle className="text-base">
                          {item.question}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex items-center gap-3 text-xs">
                            <span>{item.helpful || 0} helpful</span>
                            <span>{item.views || 0} views</span>
                            <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded">
                              {item.category}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {item.answer}
                        </p>
                      </div>

                      {item.tags.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
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

                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Was this helpful?
                          </span>
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Yes
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            No
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onQuestionSelect?.(item)}
                        >
                          View Full Answer
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* Recent Questions */}
        {showRecent && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recently Updated
            </h2>
            <div className="grid gap-3">
              {recentFAQ.map((item) => (
                <Card
                  key={item.id}
                  className="hover:bg-accent/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.question}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.answer}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onQuestionSelect?.(item)}
                      >
                        Read
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Contact Support */}
        <section className="text-center pt-6 border-t">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Still need help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Can't find the answer you're looking for? Our support team is
                here to help.
              </p>
              <Button onClick={onContactSupport}>Contact Support</Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </ScrollArea>
  );
}
