import {
  ServiceClients,
  CreateHookPayload,
  UpdateHookPayload,
  ListHooksFilters,
  HookRecord,
  AddEffectPayload,
  HookEffect,
  EffectType,
} from '../../services/hooks/types';
import { createHookService } from '../../services/hooks';
import type { CommandContext } from '../types';
import { getUserIdFromContext, getAccountIdFromUserId } from '../account-utils';

const hookService = createHookService({});

export interface CreateHookCommandInput extends CreateHookPayload {}

export interface CreateHookCommandOutput {
  hook: HookRecord;
}

export async function createHook(
  clients: ServiceClients,
  input: CreateHookCommandInput,
  context?: CommandContext,
): Promise<CreateHookCommandOutput> {
  const userId = getUserIdFromContext(context);
  const accountId = await getAccountIdFromUserId(clients, userId);

  const { hookId } = await hookService.scoped(clients).create(accountId, input);
  const hook = await hookService.scoped(clients).get(hookId);
  return { hook: hook! };
}

export interface UpdateHookCommandInput extends UpdateHookPayload {
  hookId: string;
}

export interface UpdateHookCommandOutput {
  hook: HookRecord;
}

export async function updateHook(
  clients: ServiceClients,
  input: UpdateHookCommandInput,
  context?: CommandContext,
): Promise<UpdateHookCommandOutput> {
  const userId = getUserIdFromContext(context);
  const accountId = await getAccountIdFromUserId(clients, userId);

  const { hookId, ...updateData } = input;
  const service = hookService.scoped(clients);
  await service.update(hookId, accountId, updateData);
  const hook = await service.get(hookId);
  return { hook: hook! };
}

export interface DeleteHookCommandInput {
  hookId: string;
}

export interface DeleteHookCommandOutput {
  success: boolean;
}

export async function deleteHook(
  clients: ServiceClients,
  input: DeleteHookCommandInput,
  context?: CommandContext,
): Promise<DeleteHookCommandOutput> {
  const userId = getUserIdFromContext(context);
  const accountId = await getAccountIdFromUserId(clients, userId);

  const service = hookService.scoped(clients);
  await service.delete(input.hookId, accountId);
  return { success: true };
}

export interface ListHooksCommandInput extends ListHooksFilters {}

export interface ListHooksCommandOutput {
  hooks: HookRecord[];
}

export async function listHooks(
  clients: ServiceClients,
  input: ListHooksCommandInput,
  context?: CommandContext,
): Promise<ListHooksCommandOutput> {
  const userId = getUserIdFromContext(context);
  const accountId = await getAccountIdFromUserId(clients, userId);

  const service = hookService.scoped(clients);
  const { hooks } = await service.list(accountId, input);
  return { hooks };
}

export interface GetHookCommandInput {
  hookId: string;
}

export interface GetHookCommandOutput {
  hook: HookRecord | null;
}

export async function getHook(
  clients: ServiceClients,
  input: GetHookCommandInput,
  context?: CommandContext,
): Promise<GetHookCommandOutput> {
  const service = hookService.scoped(clients);
  const hook = await service.get(input.hookId);
  return { hook };
}

export interface LinkHookCommandInput {
  hookId: string;
  agentId: string;
}

export interface LinkHookCommandOutput {
  success: boolean;
}

export async function linkHook(
  clients: ServiceClients,
  input: LinkHookCommandInput,
  context?: CommandContext,
): Promise<LinkHookCommandOutput> {
  const service = hookService.scoped(clients);
  await service.linkToAgent(input.hookId, input.agentId);
  return { success: true };
}

export interface UnlinkHookCommandInput {
  hookId: string;
  agentId: string;
}

export interface UnlinkHookCommandOutput {
  success: boolean;
}

export async function unlinkHook(
  clients: ServiceClients,
  input: UnlinkHookCommandInput,
  context?: CommandContext,
): Promise<UnlinkHookCommandOutput> {
  const service = hookService.scoped(clients);
  await service.unlinkFromAgent(input.hookId, input.agentId);
  return { success: true };
}

export interface AddHookEffectCommandInput extends AddEffectPayload {
  hookId: string;
}

export interface AddHookEffectCommandOutput {
  success: boolean;
}

export async function addHookEffect(
  clients: ServiceClients,
  input: AddHookEffectCommandInput,
  context?: CommandContext,
): Promise<AddHookEffectCommandOutput> {
  const userId = getUserIdFromContext(context);
  const accountId = await getAccountIdFromUserId(clients, userId);

  const service = hookService.scoped(clients);
  await service.addEffect(input.hookId, accountId, input);
  return { success: true };
}

export interface RemoveHookEffectCommandInput {
  hookId: string;
  effectType: EffectType;
  effectId: string;
}

export interface RemoveHookEffectCommandOutput {
  success: boolean;
}

export async function removeHookEffect(
  clients: ServiceClients,
  input: RemoveHookEffectCommandInput,
  context?: CommandContext,
): Promise<RemoveHookEffectCommandOutput> {
  const userId = getUserIdFromContext(context);
  const accountId = await getAccountIdFromUserId(clients, userId);

  const service = hookService.scoped(clients);
  await service.removeEffect(input.hookId, accountId, input.effectType, input.effectId);
  return { success: true };
}

export interface ListHookEffectsCommandInput {
  hookId: string;
}

export interface ListHookEffectsCommandOutput {
  effects: HookEffect[];
}

export async function listHookEffects(
  clients: ServiceClients,
  input: ListHookEffectsCommandInput,
  context?: CommandContext,
): Promise<ListHookEffectsCommandOutput> {
  const service = hookService.scoped(clients);
  const { effects } = await service.listEffects(input.hookId);
  return { effects };
}