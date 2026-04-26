import {
  ServiceClients,
  SkillScopedService,
  CreateSkillPayload,
  UpdateSkillPayload,
  SkillRecord,
} from './types';

export function createSkillScopedService(
  clients: ServiceClients,
): SkillScopedService {
  return {
    async list(accountId: string): Promise<SkillRecord[]> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('skills')
        .select('*')
        .or(
          `account_id.eq.${accountId},and(is_private.eq.false,is_active.eq.true)`,
        )
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map((row: unknown) => mapRow(row));
    },

    async get(skillId: string): Promise<SkillRecord | null> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('skills')
        .select('*')
        .eq('id', skillId)
        .single();

      if (error || !data) throw new Error('Skill not found');
      return mapRow(data);
    },

    async create(
      accountId: string,
      payload: CreateSkillPayload,
    ): Promise<SkillRecord> {
      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('skills')
        .insert({
          account_id: accountId,
          name: payload.name,
          description: payload.description,
          content: payload.content,
          is_private: payload.isPrivate ?? false,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data);
    },

    async update(
      skillId: string,
      accountId: string,
      payload: UpdateSkillPayload,
    ): Promise<SkillRecord> {
      const updateData: Record<string, unknown> = {};

      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.description !== undefined)
        updateData.description = payload.description;
      if (payload.content !== undefined) updateData.content = payload.content;
      if (payload.isPrivate !== undefined)
        updateData.is_private = payload.isPrivate;
      if (payload.isActive !== undefined)
        updateData.is_active = payload.isActive;

      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('skills')
        .update(updateData)
        .eq('id', skillId)
        .eq('account_id', accountId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data);
    },

    async delete(skillId: string): Promise<{ success: boolean }> {
      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('skills')
        .delete()
        .eq('id', skillId);

      if (error) throw new Error('Cannot delete skill');
      return { success: true };
    },
  };
}

function mapRow(row: unknown): SkillRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    accountId: r.account_id as string,
    name: r.name as string,
    description: r.description as string,
    content: r.content as Record<string, unknown>,
    isPrivate: r.is_private as boolean,
    isActive: r.is_active as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
