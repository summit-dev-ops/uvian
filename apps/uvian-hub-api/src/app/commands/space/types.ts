import { Space } from '../../services/spaces/types';
import type { HubEventEmitter } from '../../plugins/event-emitter';

export interface CreateSpaceCommandInput {
  userId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
  settings?: Record<string, unknown>;
  isPrivate?: boolean;
}

export interface CreateSpaceCommandOutput {
  space: Space;
}

export interface UpdateSpaceCommandInput {
  userId: string;
  spaceId: string;
  name?: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
  settings?: Record<string, unknown>;
  isPrivate?: boolean;
}

export interface UpdateSpaceCommandOutput {
  space: Space;
}

export interface DeleteSpaceCommandInput {
  userId: string;
  spaceId: string;
}

export interface DeleteSpaceCommandOutput {
  success: boolean;
}

export interface InviteSpaceMemberCommandInput {
  userId: string;
  spaceId: string;
  targetUserId: string;
  role?: { name: string };
}

export interface InviteSpaceMemberCommandOutput {
  member: { spaceId: string; userId: string; role: { name: string } };
}

export interface RemoveSpaceMemberCommandInput {
  userId: string;
  spaceId: string;
  targetUserId: string;
}

export interface RemoveSpaceMemberCommandOutput {
  success: boolean;
}

export interface UpdateSpaceMemberRoleCommandInput {
  userId: string;
  spaceId: string;
  targetUserId: string;
  role: { name: string };
}

export interface UpdateSpaceMemberRoleCommandOutput {
  member: { spaceId: string; userId: string; role: { name: string } };
}

export interface CommandContext {
  eventEmitter?: HubEventEmitter;
}
