import fp from 'fastify-plugin';
import { createChatService } from '../services/chat';
import { createNoteService } from '../services/note';
import { createPostService } from '../services/post';
import { createAssetService } from '../services/asset';
import { createSpacesService } from '../services/spaces';
import { profileService } from '../services/factory';
import type { HubEventEmitter } from '../plugins/event-emitter.js';

const noteService = createNoteService({});
const postService = createPostService({});
const assetService = createAssetService({});
const spacesService = createSpacesService({});
const chatService = createChatService({});

export interface Services {
  note: ReturnType<typeof createNoteService>;
  post: ReturnType<typeof createPostService>;
  asset: ReturnType<typeof createAssetService>;
  profile: typeof profileService;
  spaces: ReturnType<typeof createSpacesService>;
  chat: ReturnType<typeof createChatService>;
  account: any;
  user: any;
  eventEmitter: HubEventEmitter;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: Services;
  }
}

export default fp(async (fastify) => {
  fastify.decorate('services', {
    note: noteService,
    post: postService,
    asset: assetService,
    profile: profileService,
    spaces: spacesService,
    chat: chatService,
    account: {},
    user: {},
    eventEmitter: fastify.eventEmitter,
  });
});
