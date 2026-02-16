import { queryOptions } from '@tanstack/react-query';
import { supportQueryKeys } from './keys';
import type {
  SupportSearchParams,
  SupportSearchResults,
  SupportCategory,
  ContactSupportRequest,
  SupportTicket,
  FAQItem,
} from '../types';

// Mock data for offline functionality
const mockFAQData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I start a new conversation?',
    answer:
      'To start a new conversation, click on the "New Chat" button in the Chats section. You can choose to create a direct conversation with another user or start a group conversation in a space.',
    category: 'Getting Started',
    tags: ['chats', 'getting-started', 'conversations'],
    helpful: 45,
    notHelpful: 3,
    views: 156,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    question: 'How do I invite someone to a space?',
    answer:
      'Navigate to the space you want to invite someone to, click on "Members" and then "Invite Members". You can search for users by name or email and send them an invitation.',
    category: 'Spaces',
    tags: ['spaces', 'invitations', 'members'],
    helpful: 32,
    notHelpful: 1,
    views: 89,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    question: 'What are workflow automation jobs and how do they work?',
    answer:
      'Workflow automation jobs are background processes that execute predefined workflows. They can be triggered by events, scheduled, or run manually. Set up in the Jobs dashboard with configurable triggers and actions.',
    category: 'Workflow Automation',
    tags: ['workflow', 'automation', 'jobs', 'background'],
    helpful: 28,
    notHelpful: 2,
    views: 67,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
  },
  {
    id: '4',
    question: 'How do I update my profile information?',
    answer:
      'Go to Settings > Profile to update your personal information, skills, experience, and other profile details. Changes are saved automatically.',
    category: 'Account',
    tags: ['profile', 'settings', 'account'],
    helpful: 56,
    notHelpful: 4,
    views: 234,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: '5',
    question: 'How does the search functionality work?',
    answer:
      'The search function uses intelligent matching to find relevant content across profiles, spaces, conversations, and jobs. You can filter results by type and use advanced search operators.',
    category: 'Features',
    tags: ['search', 'features', 'navigation'],
    helpful: 19,
    notHelpful: 0,
    views: 43,
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: '6',
    question: 'How do I create a new workflow process?',
    answer:
      'Navigate to the Jobs section and click "Create New Process". Configure your workflow steps, set triggers, and define automation rules. You can also use templates for common business processes.',
    category: 'Getting Started',
    tags: ['workflow', 'process', 'automation', 'jobs'],
    helpful: 42,
    notHelpful: 2,
    views: 189,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-21'),
  },
  {
    id: '7',
    question: 'How do I schedule automation jobs to run automatically?',
    answer:
      'You can schedule automation jobs using cron-like expressions or preset intervals. Navigate to the Jobs dashboard, select your process, and configure the schedule in the Automation tab.',
    category: 'Workflow Automation',
    tags: ['scheduling', 'automation', 'cron', 'process'],
    helpful: 31,
    notHelpful: 1,
    views: 98,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '8',
    question: 'How do I set up team collaboration spaces?',
    answer:
      'Create a new Space from the main navigation, then invite team members through the Members section. Configure permissions and access levels for different team roles.',
    category: 'Spaces & Collaboration',
    tags: ['spaces', 'collaboration', 'team', 'members'],
    helpful: 55,
    notHelpful: 3,
    views: 245,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-22'),
  },
];

const mockCategories: SupportCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Basic guides to help you get started with Uvian',
    faqCount: 12,
    icon: '🚀',
  },
  {
    id: 'account',
    name: 'Account & Profile',
    description: 'Manage your account settings and profile information',
    faqCount: 8,
    icon: '👤',
  },
  {
    id: 'spaces',
    name: 'Spaces & Collaboration',
    description: 'Work together in shared spaces and collaborate effectively',
    faqCount: 15,
    icon: '🏢',
  },
  {
    id: 'chats',
    name: 'Chats & Messaging',
    description:
      'Send messages, start conversations, and communicate with others',
    faqCount: 10,
    icon: '💬',
  },
  {
    id: 'jobs',
    name: 'Workflow Automation',
    description: 'Create and manage automated workflow processes and jobs',
    faqCount: 7,
    icon: '⚙️',
  },
  {
    id: 'features',
    name: 'Features & Tips',
    description: 'Learn about Uvian features and best practices',
    faqCount: 20,
    icon: '⭐',
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Fix common issues and technical problems',
    faqCount: 6,
    icon: '🔧',
  },
];

// Mock API implementation for offline functionality
const mockSupportAPI = {
  async searchFAQ(params: SupportSearchParams): Promise<SupportSearchResults> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    let filteredItems = mockFAQData;

    // Filter by query
    if (params.query?.trim()) {
      const query = params.query.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (params.category && params.category !== 'all') {
      // Handle category ID to name mapping
      const categoryNameMap: Record<string, string> = {
        'getting-started': 'Getting Started',
        account: 'Account & Profile',
        spaces: 'Spaces & Collaboration',
        chats: 'Chats & Messaging',
        jobs: 'Workflow Automation',
        features: 'Features & Tips',
        troubleshooting: 'Troubleshooting',
      };

      const categoryName = categoryNameMap[params.category] || params.category;
      filteredItems = filteredItems.filter(
        (item) => item.category.toLowerCase() === categoryName.toLowerCase()
      );
    }

    // Apply limit and offset for pagination
    const startIndex = params.offset || 0;
    const endIndex = startIndex + (params.limit || 10);
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    // Convert to UI format with relevance scoring
    const items = paginatedItems.map((item) => ({
      ...item,
      relevanceScore: params.query
        ? calculateRelevanceScore(item, params.query)
        : undefined,
    }));

    return {
      items,
      totalCount: filteredItems.length,
      hasMore: endIndex < filteredItems.length,
      query: params,
    };
  },

  async getCategories(): Promise<SupportCategory[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockCategories;
  },

  async submitContactForm(
    request: ContactSupportRequest
  ): Promise<SupportTicket> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const ticket: SupportTicket = {
      id: `ticket_${Date.now()}`,
      subject: request.subject,
      message: request.message,
      status: 'open',
      priority: request.priority,
      category: request.category,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: request.userId || 'current-user',
    };

    return ticket;
  },
};

// Helper function to calculate relevance score
function calculateRelevanceScore(item: FAQItem, query: string): number {
  const queryLower = query.toLowerCase();
  let score = 0;

  // Question matches get highest score
  if (item.question.toLowerCase().includes(queryLower)) {
    score += 10;
  }

  // Answer matches get medium score
  if (item.answer.toLowerCase().includes(queryLower)) {
    score += 5;
  }

  // Tag matches get lower score
  const tagMatches = item.tags.filter((tag) =>
    tag.toLowerCase().includes(queryLower)
  ).length;
  score += tagMatches * 2;

  // Category matches get additional score
  if (item.category.toLowerCase().includes(queryLower)) {
    score += 3;
  }

  return score;
}

// ============================================================================
// Query Options - Following the profile domain pattern
// ============================================================================

export const supportQueries = {
  /**
   * Search FAQ items with optional filtering and pagination.
   */
  searchFAQ: (params: SupportSearchParams) =>
    queryOptions({
      queryKey: supportQueryKeys.faq(params),
      queryFn: () => mockSupportAPI.searchFAQ(params),
      staleTime: 1000 * 60 * 5, // 5 minutes - FAQ content doesn't change often
      gcTime: 1000 * 60 * 10, // 10 minutes
      enabled: Boolean(params.query?.trim()), // Only search when there's a query
    }),

  /**
   * Fetch all available FAQ categories.
   */
  categories: () =>
    queryOptions({
      queryKey: supportQueryKeys.categories(),
      queryFn: () => mockSupportAPI.getCategories(),
      staleTime: 1000 * 60 * 30, // 30 minutes - categories rarely change
      gcTime: 1000 * 60 * 60, // 1 hour
    }),
};

// Export the mock API for testing and direct access
export { mockSupportAPI };
