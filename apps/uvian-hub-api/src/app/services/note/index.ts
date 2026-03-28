import { ServiceClients } from '../types';
import { createNoteScopedService } from './scoped';
import { createNoteAdminService } from './admin';
import {
  NoteScopedService,
  NoteAdminService,
  CreateNoteServiceConfig,
} from './types';

export function createNoteService(_config: CreateNoteServiceConfig): {
  scoped: (clients: ServiceClients) => NoteScopedService;
  admin: (clients: ServiceClients) => NoteAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createNoteScopedService(clients),
    admin: (clients: ServiceClients) => createNoteAdminService(clients),
  };
}

export type {
  NoteScopedService,
  NoteAdminService,
  Note,
  CreateNoteInput,
  UpdateNoteInput,
  CreateNoteServiceConfig,
} from './types';
