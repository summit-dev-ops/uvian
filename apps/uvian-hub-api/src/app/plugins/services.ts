import fp from 'fastify-plugin';
import { chatService } from '../services/chat.service';
import { accountService } from '../services/account.service';
import { noteService } from '../services/note.service.js';
import { postService } from '../services/post.service.js';
import { assetService } from '../services/asset.service.js';
import { profileService } from '../services/profile.service.js';
import { spacesService } from '../services/spaces.service.js';
import { feedService } from '../services/feed.service.js';
import { userService } from '../services/user.service.js';
import { EventEmitterService } from '../plugins/event-emitter.js';

export interface Services {
  chat: typeof chatService;
  account: typeof accountService;
  note: typeof noteService;
  post: typeof postService;
  asset: typeof assetService;
  profile: typeof profileService;
  spaces: typeof spacesService;
  feed: typeof feedService;
  user: typeof userService;
  eventEmitter: EventEmitterService;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: Services;
  }
}

export default fp(async (fastify) => {
  fastify.decorate('services', {
    chat: chatService,
    account: accountService,
    note: noteService,
    post: postService,
    asset: assetService,
    profile: profileService,
    spaces: spacesService,
    feed: feedService,
    user: userService,
    eventEmitter: fastify.eventEmitter,
  });
});
