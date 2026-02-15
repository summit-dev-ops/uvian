/**
 * Support Domain Types
 *
 * Type definitions for the Support feature including FAQ items,
 * search parameters, and UI representations.
 */

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportSearchParams {
  query: string;
  category?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface SupportSearchResults {
  items: SupportUI[];
  totalCount: number;
  hasMore: boolean;
  query: SupportSearchParams;
}

export interface SupportUI {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  relevanceScore?: number;
  helpful?: number;
  notHelpful?: number;
  views?: number;
}

export interface SupportCategory {
  id: string;
  name: string;
  description: string;
  faqCount: number;
  icon?: string;
}

export interface ContactSupportRequest {
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category:
    | 'general'
    | 'technical'
    | 'billing'
    | 'feature-request'
    | 'bug-report';
  userId?: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: ContactSupportRequest['priority'];
  category: ContactSupportRequest['category'];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Query Keys for TanStack Query
export const supportQueryKeys = {
  all: ['support'] as const,
  faq: (params: SupportSearchParams) => ['support', 'faq', params] as const,
  categories: () => ['support', 'categories'] as const,
  ticket: (ticketId: string) => ['support', 'ticket', ticketId] as const,
  searchHistory: (userId: string) =>
    ['support', 'searchHistory', userId] as const,
};
