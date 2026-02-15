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
    question: 'What are the different job types available?',
    answer:
      'Uvian supports various job types including full-time, part-time, contract, and freelance positions. Each job type has different requirements and payment structures.',
    category: 'Jobs',
    tags: ['jobs', 'job-types', 'employment'],
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
    name: 'Jobs & Opportunities',
    description: 'Find and manage job opportunities and applications',
    faqCount: 7,
    icon: '💼',
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
      filteredItems = filteredItems.filter(
        (item) => item.category.toLowerCase() === params.category?.toLowerCase()
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
