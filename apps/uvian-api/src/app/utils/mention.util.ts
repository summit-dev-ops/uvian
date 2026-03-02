import { adminSupabase } from '../clients/supabase.client';
import type { Attachment, MentionAttachment } from '../types/chat.types';

/**
 * Utility for parsing and processing mentions in chat messages
 * Format: [@ id="uuid" label="Display Name"]
 */

export interface Mention {
  id: string;
  label: string;
}

export interface ExtractedMention {
  userId: string;
  label: string;
  source: 'inline' | 'attachment';
}

export interface AgentMention extends Mention {
  isAgent: true;
}

export class MentionUtil {
  /**
   * Parse mentions from message content
   * Format: [@ id="uuid" label="Display Name"]
   */
  static parseMentions(content: string): Mention[] {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const mentionRegex = /\[@ id="([a-fA-F0-9-]+)" label="([^"]+)"\]/g;
    const mentions: Mention[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push({
        id: match[1],
        label: match[2],
      });
    }

    return mentions;
  }

  /**
   * Validate that mentioned profiles exist and are agents
   */
  static async validateAgentMentions(mentionIds: string[]): Promise<string[]> {
    if (!mentionIds.length) {
      return [];
    }

    // Get all mentioned profiles and filter for agents
    const { data: profiles, error } = await adminSupabase
      .from('profiles')
      .select('id, type')
      .in('id', mentionIds);

    if (error) {
      throw new Error(`Failed to validate mention profiles: ${error.message}`);
    }

    // Filter for agent profiles only
    const agentIds =
      profiles
        ?.filter((profile) => profile.type === 'agent')
        .map((profile) => profile.id) || [];

    return agentIds;
  }

  /**
   * Check if there are any existing 'chat' jobs for the given agent in the conversation
   */
  static async hasExistingChatJob(
    conversationId: string,
    agentProfileId: string
  ): Promise<boolean> {
    const { data: jobs, error } = await adminSupabase
      .from('jobs')
      .select('id')
      .eq('type', 'chat')
      .eq('status', 'queued') // Only check for queued jobs
      .eq('input->>agentProfileId', agentProfileId)
      .eq('input->>conversationId', conversationId);

    if (error) {
      throw new Error(`Failed to check existing jobs: ${error.message}`);
    }

    return (jobs?.length || 0) > 0;
  }

  /**
   * Process mentions in message content and return valid agent mentions
   */
  static async processMentions(content: string): Promise<string[]> {
    const mentions = this.parseMentions(content);

    if (!mentions.length) {
      return [];
    }

    const mentionIds = mentions.map((m) => m.id);
    const agentIds = await this.validateAgentMentions(mentionIds);

    return agentIds;
  }

  /**
   * Extract all mentions from both inline text and attachments
   */
  static extractAllMentions(
    content: string,
    attachments: Attachment[] = []
  ): ExtractedMention[] {
    const mentions: ExtractedMention[] = [];

    // From inline text
    const inlineMentions = this.parseMentions(content);
    inlineMentions.forEach((m) =>
      mentions.push({ userId: m.id, label: m.label, source: 'inline' })
    );

    // From attachments
    attachments
      .filter((a): a is MentionAttachment => a.type === 'mention')
      .forEach((a) =>
        mentions.push({
          userId: a.userId,
          label: a.label,
          source: 'attachment',
        })
      );

    return mentions;
  }
}
