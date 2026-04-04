import { createSkillScopedService } from './scoped';
import { ServiceClients, SkillScopedService, SkillAdminService } from './types';

export function createSkillService(): {
  scoped: (clients: ServiceClients) => SkillScopedService;
  admin: (clients: ServiceClients) => SkillAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createSkillScopedService(clients),
    admin: (clients: ServiceClients) => ({
      async getById(skillId: string) {
        const { data, error } = await clients.adminClient
          .schema('core_automation')
          .from('skills')
          .select('*')
          .eq('id', skillId)
          .single();

        if (error || !data) return null;
        const r = data as Record<string, unknown>;
        return {
          id: r.id as string,
          accountId: r.account_id as string,
          name: r.name as string,
          description: r.description as string,
          content: r.content as Record<string, unknown>,
          autoLoadEvents: (r.auto_load_events as string[]) || [],
          isPrivate: r.is_private as boolean,
          isActive: r.is_active as boolean,
          createdAt: r.created_at as string,
          updatedAt: r.updated_at as string,
        };
      },
    }),
  };
}

export const skillService = createSkillService();

export type {
  ServiceClients,
  SkillScopedService,
  SkillAdminService,
  CreateSkillPayload,
  UpdateSkillPayload,
  SkillRecord,
  LinkedSkill,
} from './types';
