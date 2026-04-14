import {
  ServiceClients,
  CreateSkillPayload,
  UpdateSkillPayload,
  SkillRecord,
} from '../../services/skill/types';
import { createSkillService } from '../../services/skill';
import type { CommandContext } from '../types';

const skillService = createSkillService();

export interface CreateSkillCommandInput extends CreateSkillPayload {
  accountId: string;
}

export interface CreateSkillCommandOutput {
  skill: SkillRecord;
}

export async function createSkill(
  clients: ServiceClients,
  input: CreateSkillCommandInput,
  context?: CommandContext,
): Promise<CreateSkillCommandOutput> {
  const skill = await skillService.scoped(clients).create(input);

  if (context?.eventEmitter) {
    context.eventEmitter.emitSkillCreated(
      {
        skillId: skill.id,
        accountId: input.accountId,
        name: input.name,
        createdBy: input.accountId,
      },
      input.accountId,
    );
  }

  return { skill };
}

export interface UpdateSkillCommandInput extends UpdateSkillPayload {
  skillId: string;
  accountId: string;
}

export interface UpdateSkillCommandOutput {
  skill: SkillRecord;
}

export async function updateSkill(
  clients: ServiceClients,
  input: UpdateSkillCommandInput,
  context?: CommandContext,
): Promise<UpdateSkillCommandOutput> {
  const { skillId, accountId, ...updateData } = input;
  const skill = await skillService.scoped(clients).update(skillId, updateData);

  if (context?.eventEmitter) {
    context.eventEmitter.emitSkillUpdated(
      {
        skillId: skill.id,
        updatedBy: accountId,
        name: updateData.name,
      },
      accountId,
    );
  }

  return { skill };
}

export interface DeleteSkillCommandInput {
  skillId: string;
  accountId: string;
}

export interface DeleteSkillCommandOutput {
  success: boolean;
}

export async function deleteSkill(
  clients: ServiceClients,
  input: DeleteSkillCommandInput,
  context?: CommandContext,
): Promise<DeleteSkillCommandOutput> {
  await skillService.scoped(clients).delete(input.skillId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitSkillDeleted(
      {
        skillId: input.skillId,
        deletedBy: input.accountId,
      },
      input.accountId,
    );
  }

  return { success: true };
}
