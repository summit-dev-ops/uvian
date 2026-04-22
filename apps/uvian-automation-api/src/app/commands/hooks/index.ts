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

const hookService = createHookService({});

export interface CreateHookCommandInput extends CreateHookPayload {
  accountId: string;
}

export interface CreateHookCommandOutput {
  hook: HookRecord;
}

export async function createHook(
  clients: ServiceClients,
  input: CreateHookCommandInput,
  _context?: CommandContext,
): Promise<CreateHookCommandOutput> {
  const service = hookService.scoped(clients);
  const { hookId } = await service.create(input);
  const hook = await service.get(hookId);
  return { hook: hook! };
}

export interface UpdateHookCommandInput extends UpdateHookPayload {
  hookId: string;
  accountId: string;
}

export interface UpdateHookCommandOutput {
  hook: HookRecord;
}

export async function updateHook(
  clients: ServiceClients,
  input: UpdateHookCommandInput,
  _context?: CommandContext,
): Promise<UpdateHookCommandOutput> {
  const { hookId, ...updateData } = input;
  const service = hookService.scoped(clients);
  const hook = await service.update(hookId, updateData);
  return { hook };
}

export interface DeleteHookCommandInput {
  hookId: string;
  accountId: string;
}

export interface DeleteHookCommandOutput {
  success: boolean;
}

export async function deleteHook(
  clients: ServiceClients,
  input: DeleteHookCommandInput,
  _context?: CommandContext,
): Promise<DeleteHookCommandOutput> {
  const service = hookService.scoped(clients);
  await service.delete(input.hookId);
  return { success: true };
}

export interface ListHooksCommandInput extends ListHooksFilters {
  accountId: string;
}

export interface ListHooksCommandOutput {
  hooks: HookRecord[];
}

export async function listHooks(
  clients: ServiceClients,
  input: ListHooksCommandInput,
  _context?: CommandContext,
): Promise<ListHooksCommandOutput> {
  const service = hookService.scoped(clients);
  const { hooks } = await service.list(input);
  return { hooks };
}

export interface GetHookCommandInput {
  hookId: string;
  accountId: string;
}

export interface GetHookCommandOutput {
  hook: HookRecord | null;
}

export async function getHook(
  clients: ServiceClients,
  input: GetHookCommandInput,
  _context?: CommandContext,
): Promise<GetHookCommandOutput> {
  const service = hookService.scoped(clients);
  const hook = await service.get(input.hookId);
  return { hook };
}

export interface LinkHookCommandInput {
  hookId: string;
  agentId: string;
  accountId: string;
}

export interface LinkHookCommandOutput {
  success: boolean;
}

export async function linkHook(
  clients: ServiceClients,
  input: LinkHookCommandInput,
  _context?: CommandContext,
): Promise<LinkHookCommandOutput> {
  const service = hookService.scoped(clients);
  await service.linkToAgent(input.hookId, input.agentId);
  return { success: true };
}

export interface UnlinkHookCommandInput {
  hookId: string;
  agentId: string;
  accountId: string;
}

export interface UnlinkHookCommandOutput {
  success: boolean;
}

export async function unlinkHook(
  clients: ServiceClients,
  input: UnlinkHookCommandInput,
  _context?: CommandContext,
): Promise<UnlinkHookCommandOutput> {
  const service = hookService.scoped(clients);
  await service.unlinkFromAgent(input.hookId, input.agentId);
  return { success: true };
}

export interface AddHookEffectCommandInput extends AddEffectPayload {
  hookId: string;
  accountId: string;
}

export interface AddHookEffectCommandOutput {
  success: boolean;
}

export async function addHookEffect(
  clients: ServiceClients,
  input: AddHookEffectCommandInput,
  _context?: CommandContext,
): Promise<AddHookEffectCommandOutput> {
  const service = hookService.scoped(clients);
  await service.addEffect(input.hookId, input);
  return { success: true };
}

export interface RemoveHookEffectCommandInput {
  hookId: string;
  effectType: EffectType;
  effectId: string;
  accountId: string;
}

export interface RemoveHookEffectCommandOutput {
  success: boolean;
}

export async function removeHookEffect(
  clients: ServiceClients,
  input: RemoveHookEffectCommandInput,
  _context?: CommandContext,
): Promise<RemoveHookEffectCommandOutput> {
  const service = hookService.scoped(clients);
  await service.removeEffect(input.hookId, input.effectType, input.effectId);
  return { success: true };
}

export interface ListHookEffectsCommandInput {
  hookId: string;
  accountId: string;
}

export interface ListHookEffectsCommandOutput {
  effects: HookEffect[];
}

export async function listHookEffects(
  clients: ServiceClients,
  input: ListHookEffectsCommandInput,
  _context?: CommandContext,
): Promise<ListHookEffectsCommandOutput> {
  const service = hookService.scoped(clients);
  const { effects } = await service.listEffects(input.hookId);
  return { effects };
}