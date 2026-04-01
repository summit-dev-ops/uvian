import { adminSupabase, createUserClient } from '../../clients/supabase.client';
import { createScheduleScopedService } from './scoped';

export interface ScheduleService {
  scoped(clients: {
    adminClient: typeof adminSupabase;
    userClient: ReturnType<typeof createUserClient>;
  }): ReturnType<typeof createScheduleScopedService>;
}

export function createScheduleService({}): ScheduleService {
  return {
    scoped(clients) {
      return createScheduleScopedService(clients);
    },
  };
}
