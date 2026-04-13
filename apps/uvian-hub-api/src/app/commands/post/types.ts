import { Post } from '../../services/post/types';
import type { HubEventEmitter } from '../../plugins/event-emitter';

export interface PostContentInput {
  type: 'note' | 'asset' | 'external';
  note?: { title: string; body?: string; attachments?: unknown[] };
  noteId?: string;
  assetId?: string;
  url?: string;
}

export interface CreatePostCommandInput {
  spaceId: string;
  userId: string;
  contents?: PostContentInput[];
}

export interface CreatePostCommandOutput {
  post: Post;
}

export interface DeletePostCommandInput {
  postId: string;
  userId: string;
}

export interface DeletePostCommandOutput {
  success: boolean;
}

export interface CommandContext {
  eventEmitter?: HubEventEmitter;
}
