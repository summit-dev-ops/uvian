import { adminSupabase } from '../../clients/supabase.client';
import { jobService } from '../';
import {
  WebhookEnvelope,
  ScheduleEvents,
  ScheduleFiredData,
} from '@org/uvian-events';

export function registerScheduleHandlers(webhookHandler: any) {
  const clients = { adminClient: adminSupabase, userClient: adminSupabase };

  webhookHandler.registerHandler(
    ScheduleEvents.SCHEDULE_FIRED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as ScheduleFiredData;

      console.log('Schedule fired:', {
        scheduleId: payload.scheduleId,
        type: payload.type,
        firedAt: payload.firedAt,
        agentId,
      });

      const jobInput: Record<string, unknown> = {
        eventId: envelope.id,
        eventType: 'com.uvian.schedule.schedule_fired',
        actor: { id: envelope.subject, type: 'scheduler' },
        resource: {
          type: 'schedule',
          id: payload.scheduleId,
          data: payload.eventData,
        },
        context: {},
        agentId,
        scheduleId: payload.scheduleId,
        scheduleType: payload.type,
        firedAt: payload.firedAt,
        eventData: payload.eventData,
      };

      await jobService.scoped(clients).createEventJob({
        type: 'agent',
        input: jobInput,
      });
    }
  );
}
