import {
  ServiceClients,
  CreateSkillPayload,
  UpdateSkillPayload,
  SkillRecord,
} from '../../services/skill/types';
import { createSkillService } from '../../services/skill';
import type { CommandContext } from '../types';
import { getUserIdFromClient, getAccountIdFromUserId } from '../account-utils';

const skillService = createSkillService();

export interface CreateSkillCommandInput extends CreateSkillPayload {}

export interface CreateSkillCommandOutput {
  skill: SkillRecord;
}

export async function createSkill(
  clients: ServiceClients,
  input: CreateSkillCommandInput,
  context?: CommandContext,
): Promise<CreateSkillCommandOutput> {
  const userId = await getUserIdFromClient(clients);
  const accountId = await getAccountIdFromUserId(clients, userId);

  const skill = await skillService.scoped(clients).create(accountId, {
    name: input.name,
    description: input.description,
    content: input.content,
    isPrivate: input.isPrivate,
  });

  if (context?.eventEmitter) {
    context.eventEmitter.emitSkillCreated(
      {
        skillId: skill.id,
        accountId,
        name: input.name,
        createdBy: userId,
      },
      accountId,
    );
  }

  return { skill };
}

export interface UpdateSkillCommandInput extends UpdateSkillPayload {
  skillId: string;
}

export interface UpdateSkillCommandOutput {
  skill: SkillRecord;
}

export async function updateSkill(
  clients: ServiceClients,
  input: UpdateSkillCommandInput,
  context?: CommandContext,
): Promise<UpdateSkillCommandOutput> {
  const userId = await getUserIdFromClient(clients);
  const accountId = await getAccountIdFromUserId(clients, userId);

  const { skillId, ...updateData } = input;
  const skill = await skillService
    .scoped(clients)
    .update(skillId, accountId, updateData);

  if (context?.eventEmitter) {
    context.eventEmitter.emitSkillUpdated(
      {
        skillId: skill.id,
        updatedBy: userId,
        name: updateData.name,
      },
      accountId,
    );
  }

  return { skill };
}

export interface DeleteSkillCommandInput {
  skillId: string;
}

export interface DeleteSkillCommandOutput {
  success: boolean;
}

export async function deleteSkill(
  clients: ServiceClients,
  input: DeleteSkillCommandInput,
  context?: CommandContext,
): Promise<DeleteSkillCommandOutput> {
  const userId = await getUserIdFromClient(clients);
  const accountId = await getAccountIdFromUserId(clients, userId);

  await skillService.scoped(clients).delete(input.skillId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitSkillDeleted(
      {
        skillId: input.skillId,
        deletedBy: userId,
      },
      accountId,
    );
  }

  return { success: true };
}