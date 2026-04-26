import {
  ServiceClients,
  CreateLlmPayload,
  LlmRecord,
} from '../../services/llm/types';
import { createLlmService } from '../../services/llm';
import type { CommandContext } from '../types';
import { getUserIdFromContext, getAccountIdFromUserId } from '../account-utils';

const llmService = createLlmService({});

export interface CreateLlmCommandInput extends CreateLlmPayload {}

export interface CreateLlmCommandOutput {
  llm: LlmRecord;
}

export async function createLlm(
  clients: ServiceClients,
  input: CreateLlmCommandInput,
  context?: CommandContext,
): Promise<CreateLlmCommandOutput> {
  const userId = getUserIdFromContext(context);
  const accountId = await getAccountIdFromUserId(clients, userId);

  const llm = await llmService.scoped(clients).create(accountId, input);
  return { llm };
}

export interface UpdateLlmCommandInput {
  llmId: string;
  name?: string;
  type?: string;
  provider?: string;
  modelName?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  config?: Record<string, unknown>;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateLlmCommandOutput {
  llm: LlmRecord;
}

export async function updateLlm(
  clients: ServiceClients,
  input: UpdateLlmCommandInput,
  context?: CommandContext,
): Promise<UpdateLlmCommandOutput> {
  const { llmId, ...updateData } = input;
  const llm = await llmService.scoped(clients).update(llmId, updateData);
  return { llm };
}

export interface DeleteLlmCommandInput {
  llmId: string;
}

export interface DeleteLlmCommandOutput {
  success: boolean;
}

export async function deleteLlm(
  clients: ServiceClients,
  input: DeleteLlmCommandInput,
  context?: CommandContext,
): Promise<DeleteLlmCommandOutput> {
  await llmService.scoped(clients).delete(input.llmId);
  return { success: true };
}