import { adminSupabase } from '../clients/supabase.client';
import type { WebhookEnvelope } from '@org/uvian-events';

export interface ThreadInboxRecord {
  id: string;
  thread_id: string;
  agent_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'processed';
  created_at: string;
}

export class ThreadInboxService {
  async insertEvent(
    threadId: string,
    agentId: string | undefined,
    envelope: WebhookEnvelope
  ): Promise<string> {
    const { data, error } = await adminSupabase
      .schema('core_automation')
      .from('thread_inbox')
      .insert({
        thread_id: threadId,
        agent_id: agentId || null,
        event_type: envelope.type,
        payload: envelope.data,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Failed to insert into thread_inbox:', error);
      throw new Error(
        `Failed to insert inbox event: ${error?.message || 'Unknown error'}`
      );
    }

    return data.id as string;
  }
}

export const threadInboxService = new ThreadInboxService();
