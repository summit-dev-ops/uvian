import { generateThreadId } from '../thread-id';

describe('generateThreadId', () => {
  it('generates deterministic ID for Discord events', () => {
    const id1 = generateThreadId(
      'agent-1',
      'com.uvian.discord.message_created',
      {
        channel_id: 'channel-123',
      }
    );
    const id2 = generateThreadId(
      'agent-1',
      'com.uvian.discord.message_created',
      {
        channel_id: 'channel-123',
      }
    );
    expect(id1).toBe(id2);
    expect(id1.length).toBe(16);
  });

  it('generates different IDs for different channels', () => {
    const id1 = generateThreadId(
      'agent-1',
      'com.uvian.discord.message_created',
      {
        channel_id: 'channel-123',
      }
    );
    const id2 = generateThreadId(
      'agent-1',
      'com.uvian.discord.message_created',
      {
        channel_id: 'channel-456',
      }
    );
    expect(id1).not.toBe(id2);
  });

  it('generates different IDs for different agents on same channel', () => {
    const id1 = generateThreadId(
      'agent-1',
      'com.uvian.discord.message_created',
      {
        channel_id: 'channel-123',
      }
    );
    const id2 = generateThreadId(
      'agent-2',
      'com.uvian.discord.message_created',
      {
        channel_id: 'channel-123',
      }
    );
    expect(id1).not.toBe(id2);
  });

  it('generates deterministic ID for conversation events', () => {
    const id1 = generateThreadId('agent-1', 'message.created', {
      context: { conversationId: 'conv-123' },
    });
    const id2 = generateThreadId('agent-1', 'message.created', {
      context: { conversationId: 'conv-123' },
    });
    expect(id1).toBe(id2);
    expect(id1.length).toBe(16);
  });

  it('generates deterministic ID for ticket events', () => {
    const id = generateThreadId('agent-1', 'ticket.created', {
      resource: { id: 'ticket-789' },
    });
    expect(id.length).toBe(16);
  });

  it('generates deterministic ID for space events', () => {
    const id = generateThreadId('agent-1', 'space.member_joined', {
      resource: { id: 'space-456' },
    });
    expect(id.length).toBe(16);
  });

  it('generates deterministic ID for schedule events', () => {
    const id = generateThreadId(
      'agent-1',
      'com.uvian.schedule.schedule_fired',
      {
        scheduleId: 'schedule-123',
      }
    );
    expect(id.length).toBe(16);
  });

  it('generates deterministic ID for job events', () => {
    const id = generateThreadId('agent-1', 'job.created', {
      jobId: 'job-456',
    });
    expect(id.length).toBe(16);
  });

  it('generates fallback ID for unknown event types', () => {
    const id = generateThreadId('agent-1', 'unknown.event', {
      someField: 'value',
    });
    expect(id.length).toBe(16);
  });

  it('produces only hex characters', () => {
    const id = generateThreadId('agent-1', 'message.created', {
      context: { conversationId: 'conv-123' },
    });
    expect(id).toMatch(/^[a-f0-9]{16}$/);
  });
});
