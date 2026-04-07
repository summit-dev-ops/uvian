import { createHash } from 'crypto';

export function generateThreadId(
  agentId: string,
  eventType: string,
  eventData: Record<string, unknown>
): string {
  const parts = [agentId];

  if (eventType.startsWith('com.uvian.discord.')) {
    const data = eventData as Record<string, unknown>;
    const channelId = data.channel_id ?? data.channelId;
    parts.push(`discord_channel_${channelId}`);
  } else if (
    eventType.startsWith('com.uvian.message.') ||
    eventType.startsWith('com.uvian.conversation.') ||
    eventType.startsWith('message.') ||
    eventType.startsWith('conversation.')
  ) {
    const context = eventData.context as Record<string, unknown> | undefined;
    const conversationId = context?.conversationId ?? eventData.conversationId;
    parts.push(`conversation_${conversationId}`);
  } else if (
    eventType.startsWith('com.uvian.ticket.') ||
    eventType.startsWith('ticket.')
  ) {
    const resource = eventData.resource as Record<string, unknown> | undefined;
    const ticketId = resource?.id ?? eventData.ticketId;
    parts.push(`ticket_${ticketId}`);
  } else if (
    eventType.startsWith('com.uvian.post.') ||
    eventType.startsWith('com.uvian.note.') ||
    eventType.startsWith('com.uvian.asset.') ||
    eventType.startsWith('post.') ||
    eventType.startsWith('note.') ||
    eventType.startsWith('asset.')
  ) {
    const resource = eventData.resource as Record<string, unknown> | undefined;
    const resourceId =
      resource?.id ?? eventData.postId ?? eventData.noteId ?? eventData.assetId;
    parts.push(`content_${resourceId}`);
  } else if (
    eventType.startsWith('com.uvian.space.') ||
    eventType.startsWith('space.')
  ) {
    const resource = eventData.resource as Record<string, unknown> | undefined;
    const spaceId = resource?.id ?? eventData.spaceId;
    parts.push(`space_${spaceId}`);
  } else if (eventType.startsWith('com.uvian.schedule.')) {
    const scheduleId = eventData.scheduleId ?? eventData.id;
    parts.push(`schedule_${scheduleId}`);
  } else if (
    eventType.startsWith('com.uvian.job.') ||
    eventType.startsWith('job.')
  ) {
    const jobId = eventData.jobId ?? eventData.id;
    parts.push(`job_${jobId}`);
  } else if (eventType.startsWith('com.uvian.discord.')) {
    const context = eventData.context as Record<string, unknown> | undefined;
    const conversationId = context?.conversationId ?? eventData.conversationId;
    if (conversationId) {
      parts.push(`conversation_${conversationId}`);
    } else {
      parts.push(`discord_${eventData.externalChannelId ?? eventData.id}`);
    }
  } else {
    parts.push(`generic_${eventType}`);
  }

  return createHash('sha256')
    .update(parts.join(':'))
    .digest('hex')
    .slice(0, 16);
}
