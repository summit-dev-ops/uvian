import { ServiceClients } from '../types';
import { createPostScopedService } from './scoped';
import { createPostAdminService } from './admin';
import {
  PostScopedService,
  PostAdminService,
  CreatePostServiceConfig,
} from './types';

export function createPostService(_config: CreatePostServiceConfig): {
  scoped: (clients: ServiceClients) => PostScopedService;
  admin: (clients: ServiceClients) => PostAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createPostScopedService(clients),
    admin: (clients: ServiceClients) => createPostAdminService(clients),
  };
}

export type {
  PostScopedService,
  PostAdminService,
  Post,
  PostContent,
  CreatePostInput,
  CreatePostServiceConfig,
} from './types';
